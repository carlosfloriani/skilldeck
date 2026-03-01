import re
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


def get_agent_content(agent_id: str) -> Optional[str]:
    agent_file = AGENTS_DIR / f"{agent_id}.md"
    if not agent_file.exists():
        return None
    return agent_file.read_text(encoding="utf-8")


def save_agent_content(agent_id: str, content: str) -> bool:
    agent_file = AGENTS_DIR / f"{agent_id}.md"
    if not agent_file.exists():
        return False
    agent_file.write_text(content, encoding="utf-8")
    return True
