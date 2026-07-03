#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GHOST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${GHOST_DIR}/backups"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

cd "${GHOST_DIR}"

if [[ ! -f .env ]]; then
  echo "Missing ${GHOST_DIR}/.env. Copy .env.example to .env and fill it first." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/content"

set -a
source .env
set +a

docker compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "${BACKUP_DIR}/db/ghost-${TIMESTAMP}.sql"

docker run --rm \
  -v personal_ghost_content:/content:ro \
  -v "${BACKUP_DIR}/content:/backup" \
  alpine:3.20 \
  tar -czf "/backup/ghost-content-${TIMESTAMP}.tgz" -C /content .

echo "Created backups:"
echo "- ${BACKUP_DIR}/db/ghost-${TIMESTAMP}.sql"
echo "- ${BACKUP_DIR}/content/ghost-content-${TIMESTAMP}.tgz"
