#!/usr/bin/env bash
# PostgreSQL backup for finance_app (run on the source server).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DUMP_BASENAME="finance_app_${TIMESTAMP}"

mkdir -p "$BACKUP_DIR"

# Prefer postgres superuser to avoid large-object permission errors.
if id postgres &>/dev/null && sudo -u postgres psql -d finance_app -c 'SELECT 1' &>/dev/null; then
  echo "Backing up as postgres user..."
  sudo -u postgres pg_dump -d finance_app -F c -f "/tmp/${DUMP_BASENAME}.dump"
  sudo -u postgres pg_dump -d finance_app -f "/tmp/${DUMP_BASENAME}.sql"
  mv "/tmp/${DUMP_BASENAME}.dump" "$BACKUP_DIR/"
  mv "/tmp/${DUMP_BASENAME}.sql" "$BACKUP_DIR/"
else
  if [[ ! -f "$ROOT/backend/.env" ]]; then
    echo "Missing backend/.env and postgres user unavailable." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/backend/.env"
  set +a
  echo "Backing up as ${SPRING_DATASOURCE_USERNAME}..."
  PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" pg_dump \
    -h localhost -U "$SPRING_DATASOURCE_USERNAME" -d finance_app \
    -F c -f "$BACKUP_DIR/${DUMP_BASENAME}.dump"
  PGPASSWORD="$SPRING_DATASOURCE_PASSWORD" pg_dump \
    -h localhost -U "$SPRING_DATASOURCE_USERNAME" -d finance_app \
    -f "$BACKUP_DIR/${DUMP_BASENAME}.sql"
fi

ARCHIVE="$BACKUP_DIR/finance_app_migration_${TIMESTAMP}.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_DIR" "${DUMP_BASENAME}.dump" "${DUMP_BASENAME}.sql"

echo ""
echo "Backup complete:"
echo "  Custom format: $BACKUP_DIR/${DUMP_BASENAME}.dump"
echo "  Plain SQL:     $BACKUP_DIR/${DUMP_BASENAME}.sql"
echo "  Archive:       $ARCHIVE"
echo ""
echo "Copy the archive (and backend/.env secrets) to the new server."
