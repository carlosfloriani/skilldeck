#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# ── Backend ──────────────────────────────────────────────────────────────────
VENV="$BACKEND_DIR/.venv"

if [ ! -d "$VENV" ]; then
  echo "→ Creating Python venv…"
  python3 -m venv "$VENV"
fi

echo "→ Installing Python dependencies…"
"$VENV/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

echo "→ Starting FastAPI on :8000…"
cd "$BACKEND_DIR"
"$VENV/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "→ Installing npm dependencies…"
  npm install
fi

echo "→ Starting Vite dev server on :5173…"
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ───────────────────────────────────────────────────────────
cleanup() {
  echo ""
  echo "→ Shutting down…"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ""
echo "  SkillDeck running at http://localhost:3001"
echo "  Press Ctrl+C to stop"
echo ""

wait
