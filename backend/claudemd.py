from pathlib import Path
from typing import Optional

CLAUDE_MD = Path("~/CLAUDE.md").expanduser()


def get_content() -> Optional[str]:
    if not CLAUDE_MD.exists():
        return None
    return CLAUDE_MD.read_text(encoding="utf-8")


def save_content(content: str) -> bool:
    CLAUDE_MD.write_text(content, encoding="utf-8")
    return True
