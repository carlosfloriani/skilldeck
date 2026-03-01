import json
from pathlib import Path
from typing import Optional

SETTINGS_MAIN = Path("~/.claude/settings.json").expanduser()
SETTINGS_LOCAL = Path("~/.claude/settings.local.json").expanduser()


def _get_path(file: str) -> Optional[Path]:
    if file == "main":
        return SETTINGS_MAIN
    elif file == "local":
        return SETTINGS_LOCAL
    return None


def get_settings(file: str) -> Optional[dict]:
    path = _get_path(file)
    if path is None or not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def save_settings(file: str, data: dict) -> bool:
    path = _get_path(file)
    if path is None:
        return False
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return True
