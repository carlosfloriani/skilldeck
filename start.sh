#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PIDFILE="/tmp/skilldeck.pids"

# Verifica se já está rodando
if [ -f "$PIDFILE" ]; then
  echo "→ SkillDeck já está rodando. Use 'skilldeck down' para parar."
  exit 1
fi

# ── Backend ──────────────────────────────────────────────────────────────────
VENV="$BACKEND_DIR/.venv"

if [ ! -d "$VENV" ]; then
  echo "→ Criando Python venv…"
  python3 -m venv "$VENV"
fi

echo "→ Instalando dependências Python…"
"$VENV/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

echo "→ Subindo FastAPI em :8000…"
cd "$BACKEND_DIR"
"$VENV/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 > /tmp/skilldeck-backend.log 2>&1 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "→ Instalando dependências npm…"
  npm install
fi

echo "→ Subindo Vite em :3001…"
npm run dev > /tmp/skilldeck-frontend.log 2>&1 &
FRONTEND_PID=$!

# Salva PIDs para o stop.sh
echo "$BACKEND_PID" > "$PIDFILE"
echo "$FRONTEND_PID" >> "$PIDFILE"

echo ""
echo "  SkillDeck rodando em http://localhost:3001"
echo "  Backend:  http://localhost:8000"
echo "  Logs:     tail -f /tmp/skilldeck-backend.log"
echo "            tail -f /tmp/skilldeck-frontend.log"
echo "  Para parar: skilldeck down"
echo ""
