#!/bin/bash

# === AXPT ULTRA PATCH: TEMP PRISMA SCRUB ===
# This script will search for all files in /app/api and /lib
# that import '@/infrastructure/db/prisma' and rename them to *.temp.ts

# === CONFIG ===
SEARCH_DIRS=("app/api" "lib")
PRISMA_IMPORT="@/infrastructure/db/prisma"

# === FUNCTIONS ===
echo "\n🔍 Scanning for Prisma-dependent files..."

for DIR in "${SEARCH_DIRS[@]}"; do
  echo "\n📁 Searching in: $DIR"
  while IFS= read -r -d '' file; do
    echo "⚠️  Prisma import found in: $file"
    tempName="${file%.ts}.temp.ts"
    mv "$file" "$tempName"
    echo "✅ Renamed to: $tempName"
  done < <(grep -rlZ "$PRISMA_IMPORT" "$DIR" --include "*.ts")
done

echo "\n🎯 All Prisma-importing files have been scrubbed and renamed to .temp.ts"
echo "💡 To restore them later, rename them back manually or use a restore script."
echo "\n🚀 You may now rerun your deployment script."
