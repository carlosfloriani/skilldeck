# SkillDeck

> A local GUI dashboard to manage your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) setup — skills, agents, teams, commands, hooks, settings, and CLAUDE.md — all in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9%2B-blue?logo=python&logoColor=white)](https://www.python.org)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why SkillDeck?

Claude Code stores its configuration across multiple files and directories inside `~/.claude/`. As your setup grows — more skills, more agents, more hooks — managing everything through a text editor becomes tedious.

**SkillDeck gives you a visual interface for all of it**, running entirely on your machine. No cloud, no accounts, no data leaving your computer.

---

## Features

| Tab | What it does |
|-----|-------------|
| **Skills** | Browse all skill prompt files, toggle them per agent, edit content inline |
| **Agents** | View and edit agent definitions (name, description, tools) |
| **Teams** | Group agents into teams with custom colors |
| **Flowchart** | Interactive SVG graph showing agent → skill → tool relationships |
| **Commands** | Browse and edit all custom slash commands (`~/.claude/commands/*.md`) |
| **Settings** | Edit `settings.json` and `settings.local.json` with live JSON validation |
| **Hooks** | Edit `hooks.json` event config and view/edit hook shell scripts |
| **CLAUDE.md** | Edit your root `CLAUDE.md` with a live Markdown preview |

---

## Quick start

**Requirements:** Python 3.9+, Node.js 18+, [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed.

```bash
git clone https://github.com/carlosfloriani/skilldeck.git
cd skilldeck
chmod +x start.sh
./start.sh
```

Open **http://localhost:3001** — that's it.

`start.sh` creates a Python venv, installs dependencies, starts both servers, and shuts them down cleanly on `Ctrl+C`.

---

## Manual setup

<details>
<summary>Backend (FastAPI)</summary>

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
</details>

<details>
<summary>Frontend (Vite + React)</summary>

```bash
cd frontend
npm install
npm run dev        # runs on :3001, proxies /api → :8000
```
</details>

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | FastAPI + Python |
| Styling | Plain inline styles — zero CSS framework dependency |
| Storage | Files on disk (`~/.claude/`) — no database |

---

## What SkillDeck reads and writes

Everything stays on your machine inside `~/.claude/`.

| Path | Used for |
|------|----------|
| `~/.claude/skills/` | Skill prompt markdown files |
| `~/.claude/agents/` | Agent JSONL definitions |
| `~/.claude/teams.json` | Team configuration (managed by SkillDeck) |
| `~/.claude/commands/` | Custom slash command markdown files |
| `~/.claude/settings.json` | Global Claude Code settings |
| `~/.claude/settings.local.json` | Local overrides |
| `~/.claude/hooks/hooks.json` | Hook event configuration |
| `~/.claude/hooks/*.sh` | Hook shell scripts |
| `~/CLAUDE.md` | Root project instructions file |

---

## Project structure

```
skilldeck/
├── backend/
│   ├── main.py            # FastAPI app + all routes
│   ├── skills.py          # Skill scanning & toggle logic
│   ├── agents.py          # Agent definition reader/writer
│   ├── teams.py           # Team persistence (JSON)
│   ├── commands.py        # Custom slash command reader/writer
│   ├── settings_mgr.py    # settings.json editor
│   ├── hooks.py           # hooks.json + shell script editor
│   ├── claudemd.py        # CLAUDE.md reader/writer
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── types.ts
│       ├── components/    # Nav, lists, editors, detail panels
│       └── views/         # One view component per tab
├── .github/               # Issue templates, PR template
├── start.sh               # One-command launcher
├── CONTRIBUTING.md
└── LICENSE
```

---

## Contributing

Contributions are welcome! Check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

Found a bug? [Open an issue](https://github.com/carlosfloriani/skilldeck/issues/new?template=bug_report.md).
Have an idea? [Request a feature](https://github.com/carlosfloriani/skilldeck/issues/new?template=feature_request.md).

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
