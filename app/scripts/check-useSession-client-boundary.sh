#!/bin/bash

# === AXPT | Scan useSession Client Compliance ===
# Usage: chmod +x app/scripts/check-useSession-client.sh && app/scripts/check-useSession-client.sh

echo "🔎 Scanning app/ for useSession without 'use client' directive..."

FILES_WITH_ISSUE=()

find app/ -type f -name "*.tsx" | while read -r file; do
  if grep -q "useSession" "$file"; then
    # Check if "use client" is in the first 5 lines
    head -n 5 "$file" | grep -q '"use client"' || FILES_WITH_ISSUE+=("$file")
  fi
done

if [ ${#FILES_WITH_ISSUE[@]} -eq 0 ]; then
  echo "✅ All useSession imports are properly client-marked."
else
  echo "⚠️ Found files importing useSession without 'use client':"
  for f in "${FILES_WITH_ISSUE[@]}"; do
    echo "  - $f"
  done
  exit 1
fi