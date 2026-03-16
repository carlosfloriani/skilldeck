import io
import os
import sys
import zipfile
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Any, Optional
import skills
import agents
import teams
import commands
import settings_mgr
import hooks
import claudemd
import scheduler

app = FastAPI(title="SkillDeck API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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


class CreateSkillPayload(BaseModel):
    name: str
    description: str = ""
    license: str = "MIT"
    template: str = "standard"


class DuplicatePayload(BaseModel):
    new_name: str


class CreateAgentPayload(BaseModel):
    name: str
    description: str = ""
    tools: list[str] = []


class CreateCommandPayload(BaseModel):
    name: str
    description: str = ""
    arguments: list[dict] = []


class CreateScriptPayload(BaseModel):
    name: str


class CreateJobPayload(BaseModel):
    name: str
    cron: str
    command: str
    enabled: bool = True


class UpdateJobPayload(BaseModel):
    name: Optional[str] = None
    cron: Optional[str] = None
    command: Optional[str] = None
    enabled: Optional[bool] = None


# ── Skills ────────────────────────────────────────────────────────────────────

@app.get("/api/skills")
def list_skills():
    return skills.scan_skills()


@app.post("/api/skills")
def create_skill(payload: CreateSkillPayload):
    try:
        return skills.create_skill(payload.name, payload.description, payload.license, payload.template)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/skills/{skill_id}/content")
def get_skill_content(skill_id: str):
    try:
        content = skills.get_skill_content(skill_id)
        if content is None:
            raise HTTPException(status_code=404, detail="Skill not found")
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/skills/{skill_id}/toggle")
def toggle(skill_id: str, payload: TogglePayload):
    result = skills.toggle_agent(payload.agent, skill_id, payload.enabled)
    if not result["ok"]:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.put("/api/skills/{skill_id}/content")
def save_skill_content(skill_id: str, payload: ContentPayload):
    try:
        ok = skills.save_skill_content(skill_id, payload.content)
        if not ok:
            raise HTTPException(status_code=404, detail="Skill not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/skills/{skill_id}")
def delete_skill(skill_id: str):
    try:
        ok = skills.delete_skill(skill_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Skill not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/skills/{skill_id}/duplicate")
def duplicate_skill(skill_id: str, payload: DuplicatePayload):
    try:
        return skills.duplicate_skill(skill_id, payload.new_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/skills/{skill_id}/validate")
def validate_skill(skill_id: str):
    try:
        return skills.validate_skill(skill_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/skills/{skill_id}/export")
def export_skill(skill_id: str):
    skill_dir = skills.SKILLS_DIR / skill_id
    if not skill_dir.exists():
        raise HTTPException(status_code=404, detail="Skill not found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in skill_dir.rglob("*"):
            if file_path.is_file():
                arcname = f"{skill_id}/{file_path.relative_to(skill_dir)}"
                zf.write(file_path, arcname)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={skill_id}.zip"},
    )


@app.post("/api/skills/import")
async def import_skill(file: UploadFile):
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="File must be a .zip archive")

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(status_code=400, detail="File too large (max 100MB)")
    buf = io.BytesIO(content)

    try:
        with zipfile.ZipFile(buf, "r") as zf:
            names = zf.namelist()
            if not names:
                raise HTTPException(status_code=400, detail="Empty archive")

            top_dir = names[0].split("/")[0]
            dest = skills.SKILLS_DIR / top_dir
            if dest.exists():
                raise HTTPException(status_code=400, detail=f"Skill already exists: {top_dir}")

            # Validate all members to prevent path traversal
            for name in names:
                member_path = (skills.SKILLS_DIR / name).resolve()
                try:
                    member_path.relative_to(skills.SKILLS_DIR.resolve())
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid zip member: {name} (path traversal detected)")

            zf.extractall(skills.SKILLS_DIR)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid zip file")

    return {"ok": True, "skill_id": top_dir}


# ── Agents ────────────────────────────────────────────────────────────────────

@app.get("/api/agents")
def list_agents():
    return agents.scan_agents()


@app.post("/api/agents")
def create_agent(payload: CreateAgentPayload):
    try:
        return agents.create_agent(payload.name, payload.description, payload.tools)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/agents/{agent_id}/content")
def get_agent_content(agent_id: str):
    try:
        content = agents.get_agent_content(agent_id)
        if content is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/agents/{agent_id}/content")
def save_agent_content(agent_id: str, payload: ContentPayload):
    try:
        ok = agents.save_agent_content(agent_id, payload.content)
        if not ok:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str):
    try:
        ok = agents.delete_agent(agent_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/agents/{agent_id}/duplicate")
def duplicate_agent(agent_id: str, payload: DuplicatePayload):
    try:
        return agents.duplicate_agent(agent_id, payload.new_name)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


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


@app.post("/api/commands")
def create_command(payload: CreateCommandPayload):
    try:
        return commands.create_command(payload.name, payload.description, payload.arguments)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/commands/{cmd_id}/content")
def get_command_content(cmd_id: str):
    try:
        content = commands.get_command_content(cmd_id)
        if content is None:
            raise HTTPException(status_code=404, detail="Command not found")
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/commands/{cmd_id}/content")
def save_command_content(cmd_id: str, payload: ContentPayload):
    try:
        ok = commands.save_command_content(cmd_id, payload.content)
        if not ok:
            raise HTTPException(status_code=404, detail="Command not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/commands/{cmd_id}")
def delete_command(cmd_id: str):
    try:
        ok = commands.delete_command(cmd_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Command not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    try:
        content = hooks.get_script(name)
        if content is None:
            raise HTTPException(status_code=404, detail="Script not found")
        return {"content": content}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/hooks/scripts/{name}/content")
def save_hook_script(name: str, payload: ContentPayload):
    try:
        ok = hooks.save_script(name, payload.content)
        if not ok:
            raise HTTPException(status_code=404, detail="Script not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/hooks/scripts")
def create_hook_script(payload: CreateScriptPayload):
    try:
        ok = hooks.create_script(payload.name)
        if not ok:
            raise HTTPException(status_code=400, detail="Script already exists or invalid name")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/hooks/scripts/{name}")
def delete_hook_script(name: str):
    try:
        ok = hooks.delete_script(name)
        if not ok:
            raise HTTPException(status_code=404, detail="Script not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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


# ── Scheduler ─────────────────────────────────────────────────────────────────

@app.get("/api/scheduler/jobs")
def list_scheduler_jobs():
    return scheduler.load_jobs()


@app.post("/api/scheduler/jobs")
def create_scheduler_job(payload: CreateJobPayload):
    job = scheduler.save_job({
        "name": payload.name,
        "cron": payload.cron,
        "command": payload.command,
        "enabled": payload.enabled,
    })
    return job


@app.put("/api/scheduler/jobs/{job_id}")
def update_scheduler_job(job_id: str, payload: UpdateJobPayload):
    update = {"id": job_id}
    for field in ("name", "cron", "command", "enabled"):
        val = getattr(payload, field)
        if val is not None:
            update[field] = val
    try:
        return scheduler.save_job(update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete("/api/scheduler/jobs/{job_id}")
def delete_scheduler_job(job_id: str):
    ok = scheduler.delete_job(job_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"ok": True}


@app.post("/api/scheduler/jobs/{job_id}/run")
def run_scheduler_job(job_id: str):
    try:
        return scheduler.run_job_now(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/scheduler/jobs/{job_id}/history")
def get_scheduler_job_history(job_id: str, limit: int = 20):
    try:
        return scheduler.get_job_history(job_id, limit)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Search ────────────────────────────────────────────────────────────────────

@app.get("/api/search")
def search(q: str):
    results = []
    q_lower = q.lower()

    for skill in skills.scan_skills():
        content = skills.get_skill_content(skill["id"]) or ""
        if q_lower in content.lower() or q_lower in skill["name"].lower():
            results.append({"type": "skill", "id": skill["id"], "name": skill["name"]})

    for agent in agents.scan_agents():
        content = agents.get_agent_content(agent["id"]) or ""
        if q_lower in content.lower() or q_lower in agent["name"].lower():
            results.append({"type": "agent", "id": agent["id"], "name": agent["name"]})

    for cmd in commands.scan_commands():
        content = commands.get_command_content(cmd["id"]) or ""
        if q_lower in content.lower() or q_lower in cmd["name"].lower():
            results.append({"type": "command", "id": cmd["id"], "name": cmd["name"]})

    return results


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "skills": len(skills.scan_skills()),
        "agents": len(agents.scan_agents()),
        "scheduler_jobs": len(scheduler.load_jobs()),
    }


# ── Static Files (for macOS app) ─────────────────────────────────────────────

from fastapi.staticfiles import StaticFiles

_static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
if hasattr(sys, 'frozen'):
    _static_dir = os.path.join(sys._MEIPASS, 'dist')
if os.path.isdir(_static_dir):
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")
