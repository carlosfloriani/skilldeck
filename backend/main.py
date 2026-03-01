from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import skills
import agents
import teams
import commands
import settings_mgr
import hooks
import claudemd

app = FastAPI(title="SkillDeck API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TogglePayload(BaseModel):
    agent: str
    enabled: bool


class ContentPayload(BaseModel):
    content: str


class TeamPayload(BaseModel):
    id: str = ""
    name: str
    agents: list[str] = []
    color: str = "#3b82f6"


class JsonPayload(BaseModel):
    data: Any


# ── Skills ────────────────────────────────────────────────────────────────────

@app.get("/api/skills")
def list_skills():
    return skills.scan_skills()


@app.get("/api/skills/{skill_id}/content")
def get_skill_content(skill_id: str):
    content = skills.get_skill_content(skill_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"content": content}


@app.post("/api/skills/{skill_id}/toggle")
def toggle(skill_id: str, payload: TogglePayload):
    result = skills.toggle_agent(payload.agent, skill_id, payload.enabled)
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.put("/api/skills/{skill_id}/content")
def save_skill_content(skill_id: str, payload: ContentPayload):
    ok = skills.save_skill_content(skill_id, payload.content)
    if not ok:
        raise HTTPException(status_code=404, detail="Skill not found")
    return {"ok": True}


# ── Agents ────────────────────────────────────────────────────────────────────

@app.get("/api/agents")
def list_agents():
    return agents.scan_agents()


@app.get("/api/agents/{agent_id}/content")
def get_agent_content(agent_id: str):
    content = agents.get_agent_content(agent_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"content": content}


@app.put("/api/agents/{agent_id}/content")
def save_agent_content(agent_id: str, payload: ContentPayload):
    ok = agents.save_agent_content(agent_id, payload.content)
    if not ok:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"ok": True}


# ── Teams ─────────────────────────────────────────────────────────────────────

@app.get("/api/teams")
def list_teams():
    return teams.load_teams()


@app.post("/api/teams")
def create_team(payload: TeamPayload):
    team = teams.save_team({"name": payload.name, "agents": payload.agents, "color": payload.color})
    return team


@app.put("/api/teams/{team_id}")
def update_team(team_id: str, payload: TeamPayload):
    team = teams.save_team({"id": team_id, "name": payload.name, "agents": payload.agents, "color": payload.color})
    return team


@app.delete("/api/teams/{team_id}")
def delete_team(team_id: str):
    ok = teams.delete_team(team_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"ok": True}


# ── Commands ──────────────────────────────────────────────────────────────────

@app.get("/api/commands")
def list_commands():
    return commands.scan_commands()


@app.get("/api/commands/{cmd_id}/content")
def get_command_content(cmd_id: str):
    content = commands.get_command_content(cmd_id)
    if content is None:
        raise HTTPException(status_code=404, detail="Command not found")
    return {"content": content}


@app.put("/api/commands/{cmd_id}/content")
def save_command_content(cmd_id: str, payload: ContentPayload):
    ok = commands.save_command_content(cmd_id, payload.content)
    if not ok:
        raise HTTPException(status_code=404, detail="Command not found")
    return {"ok": True}


# ── Settings ──────────────────────────────────────────────────────────────────

@app.get("/api/settings/{file}")
def get_settings(file: str):
    if file not in ("main", "local"):
        raise HTTPException(status_code=400, detail="file must be 'main' or 'local'")
    data = settings_mgr.get_settings(file)
    if data is None:
        raise HTTPException(status_code=404, detail="Settings file not found")
    return data


@app.put("/api/settings/{file}")
def save_settings(file: str, payload: JsonPayload):
    if file not in ("main", "local"):
        raise HTTPException(status_code=400, detail="file must be 'main' or 'local'")
    ok = settings_mgr.save_settings(file, payload.data)
    if not ok:
        raise HTTPException(status_code=400, detail="Failed to save settings")
    return {"ok": True}


# ── Hooks ─────────────────────────────────────────────────────────────────────

@app.get("/api/hooks/config")
def get_hooks_config():
    data = hooks.get_hooks_config()
    if data is None:
        raise HTTPException(status_code=404, detail="hooks.json not found")
    return data


@app.put("/api/hooks/config")
def save_hooks_config(payload: JsonPayload):
    ok = hooks.save_hooks_config(payload.data)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to save hooks config")
    return {"ok": True}


@app.get("/api/hooks/scripts")
def list_hook_scripts():
    return hooks.list_scripts()


@app.get("/api/hooks/scripts/{name}/content")
def get_hook_script(name: str):
    content = hooks.get_script(name)
    if content is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"content": content}


@app.put("/api/hooks/scripts/{name}/content")
def save_hook_script(name: str, payload: ContentPayload):
    ok = hooks.save_script(name, payload.content)
    if not ok:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"ok": True}


# ── CLAUDE.md ─────────────────────────────────────────────────────────────────

@app.get("/api/claudemd")
def get_claudemd():
    content = claudemd.get_content()
    if content is None:
        raise HTTPException(status_code=404, detail="CLAUDE.md not found")
    return {"content": content}


@app.put("/api/claudemd")
def save_claudemd(payload: ContentPayload):
    ok = claudemd.save_content(payload.content)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to save CLAUDE.md")
    return {"ok": True}
