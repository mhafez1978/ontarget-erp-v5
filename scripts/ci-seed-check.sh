#!/usr/bin/env bash
set -euo pipefail

echo "Running seed preflight check (node prisma/seed.mjs --check)"
npm run seed:check

echo "Seed preflight check completed"
