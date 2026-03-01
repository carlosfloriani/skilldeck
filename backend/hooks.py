import json
from pathlib import Path
from typing import Optional

HOOKS_DIR = Path("~/.claude/hooks").expanduser()
HOOKS_CONFIG = HOOKS_DIR / "hooks.json"


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
    script = HOOKS_DIR / name
    if not script.exists():
        return None
    return script.read_text(encoding="utf-8")


def save_script(name: str, content: str) -> bool:
    if not name.endswith(".sh"):
        return False
    script = HOOKS_DIR / name
    if not script.exists():
        return False
    script.write_text(content, encoding="utf-8")
    return True
