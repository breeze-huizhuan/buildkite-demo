#!/usr/bin/env bash
# Boots the built server from downloaded artifacts and checks /health.
set -euo pipefail

npm ci --omit=dev --prefer-offline
PORT=3000 node dist/server.js &
server_pid=$!
trap 'kill "$server_pid"' EXIT

for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3000/health; then
    echo
    echo "Smoke test passed."
    exit 0
  fi
  sleep 0.5
done

echo "Server never became healthy." >&2
exit 1
