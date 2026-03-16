import json
import uuid
import subprocess
import time
import shlex
from pathlib import Path
from datetime import datetime
from typing import Optional

SCHEDULER_DIR = Path("~/.agents").expanduser()
SCHEDULER_FILE = SCHEDULER_DIR / "scheduler.json"
HISTORY_DIR = SCHEDULER_DIR / "scheduler_history"


def load_jobs() -> list[dict]:
    if not SCHEDULER_FILE.exists():
        return []
    try:
        return json.loads(SCHEDULER_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, IOError):
        return []


def _save_jobs(jobs: list[dict]) -> None:
    SCHEDULER_DIR.mkdir(parents=True, exist_ok=True)
    SCHEDULER_FILE.write_text(json.dumps(jobs, indent=2, ensure_ascii=False), encoding="utf-8")


def save_job(job: dict) -> dict:
    jobs = load_jobs()
    if job.get("id"):
        for i, j in enumerate(jobs):
            if j["id"] == job["id"]:
                jobs[i] = {**j, **job}
                _save_jobs(jobs)
                return jobs[i]
        raise ValueError(f"Job not found: {job['id']}")
    else:
        job["id"] = str(uuid.uuid4())[:8]
        job.setdefault("enabled", True)
        job.setdefault("created_at", datetime.now().isoformat())
        job.setdefault("last_run", None)
        job.setdefault("last_status", None)
        job.setdefault("last_output", None)
        job.setdefault("last_duration_ms", None)
        jobs.append(job)
        _save_jobs(jobs)
        return job


def delete_job(job_id: str) -> bool:
    jobs = load_jobs()
    new_jobs = [j for j in jobs if j["id"] != job_id]
    if len(new_jobs) == len(jobs):
        return False
    _save_jobs(new_jobs)
    history_file = HISTORY_DIR / f"{job_id}.jsonl"
    if history_file.exists():
        history_file.unlink()
    return True


def run_job_now(job_id: str) -> dict:
    jobs = load_jobs()
    job = next((j for j in jobs if j["id"] == job_id), None)
    if not job:
        raise ValueError(f"Job not found: {job_id}")

    start = time.time()
    try:
        cmd_args = shlex.split(job["command"])
        result = subprocess.run(
            cmd_args,
            shell=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
        duration_ms = int((time.time() - start) * 1000)
        status = "success" if result.returncode == 0 else "error"
        output = result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start) * 1000)
        status = "error"
        output = "Command timed out after 300 seconds"
    except Exception as e:
        duration_ms = int((time.time() - start) * 1000)
        status = "error"
        output = str(e)

    run_record = {
        "timestamp": datetime.now().isoformat(),
        "status": status,
        "duration_ms": duration_ms,
        "output": output[:10000],
    }

    for j in jobs:
        if j["id"] == job_id:
            j["last_run"] = run_record["timestamp"]
            j["last_status"] = status
            j["last_output"] = output[:2000]
            j["last_duration_ms"] = duration_ms
            break
    _save_jobs(jobs)

    _append_history(job_id, run_record)

    return run_record


def _append_history(job_id: str, record: dict) -> None:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    history_file = HISTORY_DIR / f"{job_id}.jsonl"
    with open(history_file, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def get_job_history(job_id: str, limit: int = 20) -> list[dict]:
    history_file = HISTORY_DIR / f"{job_id}.jsonl"
    if not history_file.exists():
        return []
    lines = history_file.read_text(encoding="utf-8").strip().split("\n")
    records = []
    for line in lines:
        if line.strip():
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return records[-limit:]
