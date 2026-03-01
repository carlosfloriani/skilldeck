import json
import uuid
from pathlib import Path

TEAMS_FILE = Path("~/.agents/teams.json").expanduser()


def load_teams() -> list[dict]:
    if not TEAMS_FILE.exists():
        return []
    try:
        return json.loads(TEAMS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save_teams(teams: list[dict]) -> None:
    TEAMS_FILE.parent.mkdir(parents=True, exist_ok=True)
    TEAMS_FILE.write_text(json.dumps(teams, indent=2, ensure_ascii=False), encoding="utf-8")


def save_team(team: dict) -> dict:
    teams = load_teams()
    team_id = team.get("id", "")

    if team_id:
        for i, t in enumerate(teams):
            if t["id"] == team_id:
                teams[i] = team
                break
        else:
            teams.append(team)
    else:
        team["id"] = str(uuid.uuid4())
        teams.append(team)

    _save_teams(teams)
    return team


def delete_team(team_id: str) -> bool:
    teams = load_teams()
    new_teams = [t for t in teams if t["id"] != team_id]
    if len(new_teams) == len(teams):
        return False
    _save_teams(new_teams)
    return True
