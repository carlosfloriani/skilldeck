import re
from pathlib import Path
from typing import Optional

COMMANDS_DIR = Path("~/.claude/commands").expanduser()


def parse_frontmatter(text: str) -> dict:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)", text, re.DOTALL)
    if not match:
        return {"name": "", "description": "", "arguments": [], "body": text}

    fm_text, body = match.group(1), match.group(2)
    data: dict = {"body": body.strip()}

    for field in ("name", "description"):
        m = re.search(rf"^{field}:\s*(.+)$", fm_text, re.MULTILINE)
        data[field] = m.group(1).strip() if m else ""

    # Parse arguments YAML list
    args: list[dict] = []
    args_section = re.search(r"^arguments:\s*\n((?:(?:[ \t]+.*)(?:\n|$))*)", fm_text, re.MULTILINE)
    if args_section:
        current: dict = {}
        for line in args_section.group(1).split("\n"):
            stripped = line.strip()
            if stripped.startswith("- "):
                if current:
                    args.append(current)
                current = {}
                rest = stripped[2:]
                if ":" in rest:
                    k, v = rest.split(":", 1)
                    current[k.strip()] = v.strip()
            elif ":" in stripped and stripped and not stripped.startswith("#"):
                k, v = stripped.split(":", 1)
                current[k.strip()] = v.strip()
        if current:
            args.append(current)
    # Normalize required to bool
    for arg in args:
        if "required" in arg:
            arg["required"] = str(arg["required"]).lower() in ("true", "yes", "1")
        else:
            arg["required"] = False
    data["arguments"] = args

    return data


def scan_commands() -> list[dict]:
    commands = []
    if not COMMANDS_DIR.exists():
        return commands

    for cmd_file in sorted(COMMANDS_DIR.glob("*.md")):
        cmd_id = cmd_file.stem
        text = cmd_file.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        commands.append({
            "id": cmd_id,
            "name": fm.get("name") or cmd_id,
            "description": fm.get("description", ""),
            "arguments": fm.get("arguments", []),
        })

    return commands


def _validate_command_id(cmd_id: str) -> None:
    """Validate command_id to prevent path traversal attacks."""
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', cmd_id):
        raise ValueError(f"Invalid command ID: {cmd_id}")


def get_command_content(cmd_id: str) -> Optional[str]:
    _validate_command_id(cmd_id)
    cmd_file = COMMANDS_DIR / f"{cmd_id}.md"
    if not cmd_file.exists():
        return None
    return cmd_file.read_text(encoding="utf-8")


def save_command_content(cmd_id: str, content: str) -> bool:
    _validate_command_id(cmd_id)
    cmd_file = COMMANDS_DIR / f"{cmd_id}.md"
    if not cmd_file.exists():
        return False
    cmd_file.write_text(content, encoding="utf-8")
    return True


def create_command(name: str, description: str = "", arguments: Optional[list[dict]] = None) -> dict:
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', name):
        raise ValueError("Name must be kebab-case")
    cmd_file = COMMANDS_DIR / f"{name}.md"
    if cmd_file.exists():
        raise ValueError(f"Command already exists: {name}")

    COMMANDS_DIR.mkdir(parents=True, exist_ok=True)
    arguments = arguments or []

    lines = ["---", f"name: {name}", f"description: {description}"]
    if arguments:
        lines.append("arguments:")
        for arg in arguments:
            first = True
            for k, v in arg.items():
                prefix = "- " if first else "  "
                lines.append(f"  {prefix}{k}: {v}")
                first = False
    lines.append("---")
    lines.append("")
    lines.append(f"# {name}")
    lines.append("")

    cmd_file.write_text("\n".join(lines), encoding="utf-8")

    fm = parse_frontmatter(cmd_file.read_text(encoding="utf-8"))
    return {
        "id": name,
        "name": fm.get("name") or name,
        "description": fm.get("description", ""),
        "arguments": fm.get("arguments", []),
    }


def delete_command(cmd_id: str) -> bool:
    _validate_command_id(cmd_id)
    cmd_file = COMMANDS_DIR / f"{cmd_id}.md"
    if not cmd_file.exists():
        return False
    cmd_file.unlink()
    return True
