import json
import os
import re
import stat
from pathlib import Path
from typing import Optional

HOOKS_DIR = Path("~/.claude/hooks").expanduser()
HOOKS_CONFIG = HOOKS_DIR / "hooks.json"


def _validate_script_name(name: str) -> None:
    """Validate script name to prevent path traversal attacks."""
    basename = name.removesuffix(".sh")
    if not re.match(r'^[a-zA-Z0-9_-]+$', basename):
        raise ValueError(f"Invalid script name: {name}")
    # Ensure resolved path stays within HOOKS_DIR
    resolved = (HOOKS_DIR / name).resolve()
    try:
        resolved.relative_to(HOOKS_DIR.resolve())
    except ValueError:
        raise ValueError(f"Path traversal detected: {name}")


def get_hooks_config() -> Optional[dict]:
    if not HOOKS_CONFIG.exists():
        return None
    try:
        return json.loads(HOOKS_CONFIG.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def save_hooks_config(data: dict) -> bool:
    HOOKS_DIR.mkdir(parents=True, exist_ok=True)
    HOOKS_CONFIG.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return True


def list_scripts() -> list[str]:
    if not HOOKS_DIR.exists():
        return []
    return sorted(p.name for p in HOOKS_DIR.glob("*.sh"))


def get_script(name: str) -> Optional[str]:
    if not name.endswith(".sh"):
        return None
    _validate_script_name(name)
    script = HOOKS_DIR / name
    if not script.exists():
        return None
    return script.read_text(encoding="utf-8")


def save_script(name: str, content: str) -> bool:
    if not name.endswith(".sh"):
        return False
    _validate_script_name(name)
    script = HOOKS_DIR / name
    if not script.exists():
        return False
    script.write_text(content, encoding="utf-8")
    return True


def create_script(name: str) -> bool:
    if not name.endswith(".sh"):
        name = name + ".sh"
    _validate_script_name(name)
    HOOKS_DIR.mkdir(parents=True, exist_ok=True)
    script = HOOKS_DIR / name
    if script.exists():
        return False
    script.write_text("#!/usr/bin/env bash\n\n", encoding="utf-8")
    script.chmod(script.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    return True


def delete_script(name: str) -> bool:
    if not name.endswith(".sh"):
        name = name + ".sh"
    _validate_script_name(name)
    script = HOOKS_DIR / name
    if not script.exists():
        return False
    script.unlink()
    return True
