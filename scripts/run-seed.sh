#!/usr/bin/env bash
# Lightweight helper to run the Prisma seed script while avoiding permission issues.

set -euo pipefail

SEED_FILE="prisma/seed.mjs"

if [ ! -f "$SEED_FILE" ]; then
  echo "Seed file $SEED_FILE not found."
  exit 1
fi

# Ensure read permission for current user and a sensible default
chmod 644 "$SEED_FILE" || true

echo "Running seed with: node $SEED_FILE"
node "$SEED_FILE"
