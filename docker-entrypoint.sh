#!/bin/sh
set -e

SCHEMA="/app/packages/database/prisma/schema.prisma"

if [ -f "$SCHEMA" ]; then
  echo "[entrypoint] Running prisma db push to ensure schema is up to date..."
  npx prisma db push --schema="$SCHEMA" --accept-data-loss --skip-generate 2>&1 || echo "[entrypoint] prisma db push skipped or failed (may already be up to date)"
fi

exec "$@"
