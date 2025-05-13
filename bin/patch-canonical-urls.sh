#!/bin/bash

# === AXPT | Canonical URL Refactor Script ===
# Replaces hardcoded URLs with constants across app/ and bin/

echo "🌐 Starting canonical domain patching..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILES=$(grep -rlE 'https?://(www\.)?(axpt\.io|localhost:3000)' "$ROOT_DIR/app" "$ROOT_DIR/bin" "$ROOT_DIR/public" 2>/dev/null)

for file in $FILES; do
  echo "🔧 Patching: $file"

  # Ensure import line is present for constants (only TypeScript files)
  if [[ "$file" =~ \.ts$|\.tsx$ ]] && ! grep -q 'CANONICAL_DOMAIN' "$file"; then
    tmpfile=$(mktemp)
    echo 'import { CANONICAL_DOMAIN, LOCAL_DEV_DOMAIN } from "@/lib/constants";' > "$tmpfile"
    cat "$file" >> "$tmpfile"
    mv "$tmpfile" "$file"
    echo "   ➕ Injected constants import"
  fi

  # Replace hardcoded production and dev URLs
  sed -i '' 's|https://www\.axpt\.io|${CANONICAL_DOMAIN}|g' "$file"
  sed -i '' 's|https://axpt\.io|${CANONICAL_DOMAIN}|g' "$file"
  sed -i '' 's|${LOCAL_DEV_DOMAIN}|${LOCAL_DEV_DOMAIN}|g' "$file"
done

echo "✅ Canonical URL refactor complete."