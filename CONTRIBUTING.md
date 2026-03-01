# Contributing to SkillDeck

Thanks for your interest! Contributions of all kinds are welcome.

## Ways to contribute

- **Bug reports** — open an issue with the `bug` template
- **Feature requests** — open an issue with the `enhancement` template
- **Code** — fork, branch, and open a PR
- **Docs** — improve the README or add examples

## Local development setup

```bash
git clone https://github.com/carlosfloriani/skilldeck.git
cd skilldeck
./start.sh
```

For backend-only changes:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload
```

For frontend-only changes:

```bash
cd frontend
npm run dev
```

## Guidelines

- **No external dependencies unless necessary** — the project intentionally keeps its footprint small
- **No hardcoded paths or personal data** — all user paths must resolve via `Path("~/.claude/").expanduser()`
- **Backend changes** must have a corresponding frontend change if the API surface changes
- **Keep it simple** — this is a local tool, not a SaaS product

## Project structure

```
backend/     FastAPI app — one module per domain (skills, agents, hooks…)
frontend/    React + TypeScript + Vite — one view per tab, components/ for shared UI
.github/     Issue templates and PR template
```

## Commit style

```
feat: add script creation in HooksView
fix: reset content on command selection
docs: update README with manual setup steps
```

## Questions?

Open an issue or start a discussion — happy to help.
