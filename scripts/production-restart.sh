#!/usr/bin/env bash
# Safe production restart for finance.aau.co.in
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — copy from backend/.env.example and fill secrets." >&2
  exit 1
fi

echo "Building backend..."
(cd backend && ./mvnw -ntp -q package -DskipTests)

echo "Building frontend..."
npm run build

echo "Restarting PM2 process..."
pm2 startOrRestart ecosystem.config.cjs --only finance-backend
pm2 save

echo "Waiting for health..."
for _ in $(seq 1 30); do
  if curl -sf --max-time 3 http://127.0.0.1:8080/management/health >/dev/null; then
    echo "Backend is UP."
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy in time. Check: pm2 logs finance-backend" >&2
exit 1
