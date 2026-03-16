import re
import shutil
from pathlib import Path
from typing import Optional

AGENTS_DIR = Path("~/.claude/agents").expanduser()


def parse_frontmatter(text: str) -> dict:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)", text, re.DOTALL)
    if not match:
        return {"name": "", "description": "", "tools": [], "body": text}

    fm_text, body = match.group(1), match.group(2)
    data: dict = {"body": body.strip()}

    for field in ("name", "description"):
        m = re.search(rf"^{field}:\s*(.+)$", fm_text, re.MULTILINE)
        data[field] = m.group(1).strip() if m else ""

    # Parse tools list (YAML list format: "  - ToolName")
    tools_match = re.search(r"^tools:\s*\n((?:[ \t]+-[ \t]+.+\n?)+)", fm_text, re.MULTILINE)
    if tools_match:
        tools_text = tools_match.group(1)
        data["tools"] = [re.sub(r"^\s*-\s*", "", line).strip() for line in tools_text.strip().split("\n") if line.strip()]
    else:
        data["tools"] = []

    return data


def scan_agents() -> list[dict]:
    agents = []
    if not AGENTS_DIR.exists():
        return agents

    for agent_file in sorted(AGENTS_DIR.glob("*.md")):
        agent_id = agent_file.stem
        text = agent_file.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        agents.append({
            "id": agent_id,
            "name": fm.get("name") or agent_id,
            "description": fm.get("description", ""),
            "tools": fm.get("tools", []),
        })

    return agents


def _validate_agent_id(agent_id: str) -> None:
    """Validate agent_id to prevent path traversal attacks."""
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', agent_id):
        raise ValueError(f"Invalid agent ID: {agent_id}")


def get_agent_content(agent_id: str) -> Optional[str]:
    _validate_agent_id(agent_id)
    agent_file = AGENTS_DIR / f"{agent_id}.md"
    if not agent_file.exists():
        return None
    return agent_file.read_text(encoding="utf-8")


def save_agent_content(agent_id: str, content: str) -> bool:
    _validate_agent_id(agent_id)
    agent_file = AGENTS_DIR / f"{agent_id}.md"
    if not agent_file.exists():
        return False
    agent_file.write_text(content, encoding="utf-8")
    return True


def create_agent(name: str, description: str = "", tools: Optional[list[str]] = None) -> dict:
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name):
        raise ValueError("Name must be kebab-case")
    agent_file = AGENTS_DIR / f"{name}.md"
    if agent_file.exists():
        raise ValueError(f"Agent already exists: {name}")

    AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    tools = tools or []

    lines = ["---", f"name: {name}", f"description: {description}"]
    if tools:
        lines.append("tools:")
        for tool in tools:
            lines.append(f"  - {tool}")
    lines.append("---")
    lines.append("")
    lines.append(f"# {name}")
    lines.append("")

    agent_file.write_text("\n".join(lines), encoding="utf-8")

    fm = parse_frontmatter(agent_file.read_text(encoding="utf-8"))
    return {
        "id": name,
        "name": fm.get("name") or name,
        "description": fm.get("description", ""),
        "tools": fm.get("tools", []),
    }


def delete_agent(agent_id: str) -> bool:
    _validate_agent_id(agent_id)
    agent_file = AGENTS_DIR / f"{agent_id}.md"
    if not agent_file.exists():
        return False
    agent_file.unlink()
    return True


def duplicate_agent(agent_id: str, new_name: str) -> dict:
    _validate_agent_id(agent_id)
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', new_name):
        raise ValueError("Name must be kebab-case")
    src = AGENTS_DIR / f"{agent_id}.md"
    dst = AGENTS_DIR / f"{new_name}.md"
    if not src.exists():
        raise ValueError(f"Source agent not found: {agent_id}")
    if dst.exists():
        raise ValueError(f"Agent already exists: {new_name}")

    shutil.copy2(src, dst)

    text = dst.read_text(encoding="utf-8")
    text = re.sub(r"^(name:\s*).+$", rf"\g<1>{new_name}", text, count=1, flags=re.MULTILINE)
    dst.write_text(text, encoding="utf-8")

    fm = parse_frontmatter(dst.read_text(encoding="utf-8"))
    return {
        "id": new_name,
        "name": fm.get("name") or new_name,
        "description": fm.get("description", ""),
        "tools": fm.get("tools", []),
    }
