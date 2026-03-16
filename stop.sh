#!/usr/bin/env bash
# Stop SkillDeck (backend + frontend)

PIDFILE="/tmp/skilldeck.pids"

if [ ! -f "$PIDFILE" ]; then
  echo "→ SkillDeck não está rodando (sem PID file)"
  exit 0
fi

while IFS= read -r pid; do
  if kill "$pid" 2>/dev/null; then
    echo "→ Processo $pid encerrado"
  fi
done < "$PIDFILE"

rm -f "$PIDFILE"
echo "→ SkillDeck parado"
