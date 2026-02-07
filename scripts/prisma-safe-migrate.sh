#!/usr/bin/env bash
set -e

echo "🔍 Checking Prisma schema changes..."

if git diff --quiet prisma/schema.prisma; then
  echo "⚠️  No changes detected in prisma/schema.prisma"
  echo "→ Skipping migrate dev to avoid empty migration."
  echo "Use: pnpm prisma migrate status"
  exit 0
fi

echo "✅ Schema change detected."
echo "🚀 Running prisma migrate dev..."

pnpm prisma migrate dev "$@"