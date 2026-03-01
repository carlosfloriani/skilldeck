# SkillDeck

A local dashboard to manage your [Claude Code](https://docs.anthropic.com/en/docs/claude-code) configuration — skills, agents, teams, commands, hooks, and settings — all in one place.

![SkillDeck](https://img.shields.io/badge/Claude%20Code-Manager-orange?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)

---

## Features

| Tab | What it does |
|-----|-------------|
| **Skills** | Browse, enable/disable, and edit skill prompt files per agent |
| **Agents** | View and edit agent definitions (tools, descriptions) |
| **Teams** | Create and manage agent teams with custom colors |
| **Flowchart** | Visual graph of agents, skills, and tools — filterable by team |
| **Commands** | Browse and edit all custom slash commands (`~/.claude/commands/`) |
| **Settings** | Edit `settings.json` and `settings.local.json` with JSON validation |
| **Hooks** | Edit `hooks.json` config and view/edit hook shell scripts |
| **CLAUDE.md** | Edit your root `CLAUDE.md` with live preview |

---

## Stack

- **Frontend**: React 19 + TypeScript + Vite (no CSS framework — plain inline styles)
- **Backend**: FastAPI + Python, reads/writes directly to `~/.claude/`

---

## Requirements

- Python 3.9+
- Node.js 18+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed (provides the `~/.claude/` directory)

---

## Getting Started

```bash
git clone https://github.com/carlosfloriani/skilldeck.git
cd skilldeck
chmod +x start.sh
./start.sh
```

Then open **http://localhost:3001** in your browser.

The `start.sh` script:
1. Creates a Python venv and installs dependencies
2. Starts the FastAPI backend on `:8000`
3. Starts the Vite dev server on `:3001`
4. Shuts both down cleanly on `Ctrl+C`

---

## Manual Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
skilldeck/
├── backend/
│   ├── main.py          # FastAPI app + all routes
│   ├── skills.py        # Skill scanning & toggle logic
│   ├── agents.py        # Agent definition reader/writer
│   ├── teams.py         # Team persistence (JSON)
│   ├── commands.py      # Custom slash command reader/writer
│   ├── settings_mgr.py  # settings.json / settings.local.json
│   ├── hooks.py         # hooks.json + shell script editor
│   ├── claudemd.py      # CLAUDE.md reader/writer
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx
│       ├── types.ts
│       ├── components/  # Nav, lists, editors, detail panels
│       └── views/       # One view per tab
├── start.sh
└── README.md
```

---

## What SkillDeck reads/writes

All data lives in your local `~/.claude/` directory — nothing is sent to any server.

| Path | Used for |
|------|----------|
| `~/.claude/skills/` | Skill prompt markdown files |
| `~/.claude/agents/` | Agent JSONL definitions |
| `~/.claude/teams.json` | Team configuration |
| `~/.claude/commands/` | Custom slash command markdown files |
| `~/.claude/settings.json` | Global Claude Code settings |
| `~/.claude/settings.local.json` | Local overrides |
| `~/.claude/hooks/hooks.json` | Hook event configuration |
| `~/.claude/hooks/*.sh` | Hook shell scripts |
| `~/CLAUDE.md` | Root project instructions |

---

## License

MIT
