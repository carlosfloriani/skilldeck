import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional

SKILLS_DIR = Path("~/.agents/skills").expanduser()

AGENTS: dict[str, Path] = {
    "claudeCode": Path("~/.claude/skills").expanduser(),
    "cursor":     Path("~/.cursor/skills").expanduser(),
    "codex":      Path("~/.codex/skills").expanduser(),
    "gemini":     Path("~/.gemini/skills").expanduser(),
    "amp":        Path("~/.amp/skills").expanduser(),
    "cline":      Path("~/.cline/skills").expanduser(),
}


def parse_frontmatter(text: str) -> dict:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)", text, re.DOTALL)
    if not match:
        return {
            "name": "", "description": "", "license": "",
            "allowed_tools": "", "metadata_author": "", "metadata_version": "",
            "compatibility": "", "body": text,
            "word_count": len(text.split()),
            "has_examples": bool(re.search(r'##\s*[Ee]xample', text)),
        }

    fm_text, body = match.group(1), match.group(2)
    data: dict = {"body": body.strip()}

    for field in ("name", "description", "license", "compatibility"):
        m = re.search(rf"^{field}:\s*(.+)$", fm_text, re.MULTILINE)
        data[field] = m.group(1).strip() if m else ""

    m = re.search(r"^allowed-tools:\s*(.+)$", fm_text, re.MULTILINE)
    data["allowed_tools"] = m.group(1).strip() if m else ""

    metadata_match = re.search(r"^metadata:\s*\n((?:[ \t]+.+\n?)+)", fm_text, re.MULTILINE)
    data["metadata_author"] = ""
    data["metadata_version"] = ""
    if metadata_match:
        meta_text = metadata_match.group(1)
        for key, field in [("author", "metadata_author"), ("version", "metadata_version")]:
            m = re.search(rf"^\s+{key}:\s*(.+)$", meta_text, re.MULTILINE)
            if m:
                data[field] = m.group(1).strip()

    data["word_count"] = len(body.strip().split()) if body.strip() else 0
    data["has_examples"] = bool(re.search(r'##\s*[Ee]xample', body))

    return data


def installed_agents(skill_id: str) -> dict[str, bool]:
    _validate_skill_id(skill_id)
    result: dict[str, bool] = {}
    for agent_id, agent_path in AGENTS.items():
        link = agent_path / skill_id
        result[agent_id] = link.is_symlink() or link.exists()
    return result


def scan_skills() -> list[dict]:
    skills = []
    if not SKILLS_DIR.exists():
        return skills

    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_dir.is_dir() or not skill_md.exists():
            continue

        skill_id = skill_dir.name
        text = skill_md.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        mtime = datetime.fromtimestamp(skill_md.stat().st_mtime).isoformat()

        skills.append({
            "id": skill_id,
            "name": fm.get("name") or skill_id,
            "description": fm.get("description", ""),
            "license": fm.get("license", ""),
            "allowed_tools": fm.get("allowed_tools", ""),
            "metadata_author": fm.get("metadata_author", ""),
            "metadata_version": fm.get("metadata_version", ""),
            "compatibility": fm.get("compatibility", ""),
            "word_count": fm.get("word_count", 0),
            "has_examples": fm.get("has_examples", False),
            "mtime": mtime,
            "path": str(skill_md),
            "agents": installed_agents(skill_id),
        })

    return skills


def _validate_skill_id(skill_id: str) -> None:
    """Validate skill_id to prevent path traversal attacks."""
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', skill_id):
        raise ValueError(f"Invalid skill ID: {skill_id}")
    # Ensure resolved path is within SKILLS_DIR
    resolved = (SKILLS_DIR / skill_id).resolve()
    try:
        resolved.relative_to(SKILLS_DIR.resolve())
    except ValueError:
        raise ValueError(f"Path traversal detected: {skill_id}")


def get_skill_content(skill_id: str) -> Optional[str]:
    _validate_skill_id(skill_id)
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    if not skill_md.exists():
        return None
    return skill_md.read_text(encoding="utf-8")


def save_skill_content(skill_id: str, content: str) -> bool:
    _validate_skill_id(skill_id)
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    if not skill_md.exists():
        return False
    skill_md.write_text(content, encoding="utf-8")
    return True


def toggle_agent(agent_id: str, skill_id: str, enable: bool) -> dict:
    if agent_id not in AGENTS:
        return {"ok": False, "error": f"Unknown agent: {agent_id}"}

    try:
        _validate_skill_id(skill_id)
    except ValueError as e:
        return {"ok": False, "error": str(e)}

    agent_path = AGENTS[agent_id]
    source = SKILLS_DIR / skill_id
    link = agent_path / skill_id

    if not source.exists():
        return {"ok": False, "error": f"Skill not found: {skill_id}"}

    if enable:
        agent_path.mkdir(parents=True, exist_ok=True)
        if link.is_symlink():
            link.unlink()
        if link.exists():
            return {"ok": False, "error": f"Path exists and is not a symlink: {link}"}
        os.symlink(source, link)
        return {"ok": True, "enabled": True}
    else:
        if link.is_symlink():
            link.unlink()
            return {"ok": True, "enabled": False}
        elif link.exists():
            return {"ok": False, "error": f"Path is not a symlink, refusing to delete: {link}"}
        return {"ok": True, "enabled": False}


def _build_frontmatter(name: str, description: str, license_text: str) -> str:
    return f"---\nname: {name}\ndescription: {description}\nlicense: {license_text}\n---\n"


TEMPLATES: dict[str, str] = {
    "minimal": "# {name}\n",
    "standard": (
        "# {name}\n\n"
        "## Description\n\n{description}\n\n"
        "## Usage\n\n\n\n"
        "## Examples\n\n"
    ),
    "scripts": (
        "# {name}\n\n"
        "## Description\n\n{description}\n\n"
        "## Scripts\n\n```bash\n\n```\n"
    ),
    "pattern": (
        "# {name}\n\n"
        "## Description\n\n{description}\n\n"
        "## Pattern\n\n\n\n"
        "## When to Use\n\n\n\n"
        "## Examples\n\n"
    ),
}


def create_skill(name: str, description: str = "", license_text: str = "MIT", template: str = "standard") -> dict:
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name):
        raise ValueError("Name must be kebab-case")
    if (SKILLS_DIR / name).exists():
        raise ValueError(f"Skill already exists: {name}")
    if template not in TEMPLATES:
        raise ValueError(f"Unknown template: {template}")

    skill_dir = SKILLS_DIR / name
    skill_dir.mkdir(parents=True, exist_ok=True)

    fm = _build_frontmatter(name, description, license_text)
    body = TEMPLATES[template].format(name=name, description=description)
    (skill_dir / "SKILL.md").write_text(fm + "\n" + body, encoding="utf-8")

    return scan_skills_single(name)


def scan_skills_single(skill_id: str) -> dict:
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    text = skill_md.read_text(encoding="utf-8")
    fm = parse_frontmatter(text)
    mtime = datetime.fromtimestamp(skill_md.stat().st_mtime).isoformat()
    return {
        "id": skill_id,
        "name": fm.get("name") or skill_id,
        "description": fm.get("description", ""),
        "license": fm.get("license", ""),
        "allowed_tools": fm.get("allowed_tools", ""),
        "metadata_author": fm.get("metadata_author", ""),
        "metadata_version": fm.get("metadata_version", ""),
        "compatibility": fm.get("compatibility", ""),
        "word_count": fm.get("word_count", 0),
        "has_examples": fm.get("has_examples", False),
        "mtime": mtime,
        "path": str(skill_md),
        "agents": installed_agents(skill_id),
    }


def delete_skill(skill_id: str) -> bool:
    skill_dir = SKILLS_DIR / skill_id
    if not skill_dir.exists():
        return False

    for agent_id, agent_path in AGENTS.items():
        link = agent_path / skill_id
        if link.is_symlink():
            link.unlink()

    shutil.rmtree(skill_dir)
    return True


def duplicate_skill(skill_id: str, new_name: str) -> dict:
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', new_name):
        raise ValueError("Name must be kebab-case")
    if (SKILLS_DIR / new_name).exists():
        raise ValueError(f"Skill already exists: {new_name}")
    if not (SKILLS_DIR / skill_id).exists():
        raise ValueError(f"Source skill not found: {skill_id}")

    shutil.copytree(SKILLS_DIR / skill_id, SKILLS_DIR / new_name)

    skill_md = SKILLS_DIR / new_name / "SKILL.md"
    text = skill_md.read_text(encoding="utf-8")
    text = re.sub(r"^(name:\s*).+$", rf"\g<1>{new_name}", text, count=1, flags=re.MULTILINE)
    skill_md.write_text(text, encoding="utf-8")

    return scan_skills_single(new_name)


def validate_skill(skill_id: str) -> dict:
    _validate_skill_id(skill_id)
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    if not skill_md.exists():
        raise ValueError(f"Skill not found: {skill_id}")

    text = skill_md.read_text(encoding="utf-8")
    fm = parse_frontmatter(text)
    body = fm.get("body", "")

    items: list[dict] = []

    def check(label: str, ok: bool, max_pts: int) -> None:
        items.append({"label": label, "ok": ok, "points": max_pts if ok else 0, "maxPoints": max_pts})

    check("Has name", bool(fm.get("name")), 10)
    check("Has description", bool(fm.get("description")), 10)
    check("Description > 20 chars", len(fm.get("description", "")) > 20, 10)
    check("Has license", bool(fm.get("license")), 5)
    check("Body > 50 words", len(body.split()) > 50, 15)
    check("Has examples section", bool(re.search(r'##\s*[Ee]xample', body)), 15)
    check("Has code blocks", bool(re.search(r'```', body)), 10)
    check("Has headings (## or ###)", bool(re.search(r'^#{2,3}\s', body, re.MULTILINE)), 10)
    check("No TODO/FIXME in body", not bool(re.search(r'TODO|FIXME', body)), 5)
    check("Has allowed-tools defined", bool(fm.get("allowed_tools")), 10)

    score = sum(item["points"] for item in items)
    return {"score": score, "items": items}
