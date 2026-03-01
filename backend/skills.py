import os
import re
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
        return {"name": "", "description": "", "license": "", "body": text}

    fm_text, body = match.group(1), match.group(2)
    data: dict = {"body": body.strip()}

    for field in ("name", "description", "license"):
        m = re.search(rf"^{field}:\s*(.+)$", fm_text, re.MULTILINE)
        data[field] = m.group(1).strip() if m else ""

    return data


def installed_agents(skill_id: str) -> dict[str, bool]:
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

        skills.append({
            "id": skill_id,
            "name": fm.get("name") or skill_id,
            "description": fm.get("description", ""),
            "license": fm.get("license", ""),
            "path": str(skill_md),
            "agents": installed_agents(skill_id),
        })

    return skills


def get_skill_content(skill_id: str) -> Optional[str]:
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    if not skill_md.exists():
        return None
    return skill_md.read_text(encoding="utf-8")


def save_skill_content(skill_id: str, content: str) -> bool:
    skill_md = SKILLS_DIR / skill_id / "SKILL.md"
    if not skill_md.exists():
        return False
    skill_md.write_text(content, encoding="utf-8")
    return True


def toggle_agent(agent_id: str, skill_id: str, enable: bool) -> dict:
    if agent_id not in AGENTS:
        return {"ok": False, "error": f"Unknown agent: {agent_id}"}

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
