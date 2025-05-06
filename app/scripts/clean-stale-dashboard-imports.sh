#!/bin/bash

echo "🧹 Scanning and commenting out stale dashboard imports..."

# Define stale patterns to look for
STALE_IMPORTS=(
  "from \"@/app/dashboard/Dashboard.module.css\""
  "from '@/app/dashboard/Dashboard.module.css'"
)

# Scan all TS/TSX files in app/ and comment out matching lines
find ./app -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  for pattern in "${STALE_IMPORTS[@]}"; do
    if grep -q "$pattern" "$file"; then
      echo "🛠️  Commenting import in: $file"
      sed -i '' "s|$pattern|// 🚫 Stale import (auto-commented): $pattern|" "$file"
    fi
  done
done

# Optional: Comment out dashboard class references
find ./app -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  if grep -q "styles.dashboard" "$file"; then
    echo "🛠️  Commenting out styles.dashboard reference in: $file"
    sed -i '' 's/styles\.dashboard/\/\* styles.dashboard 🚫 stale \*\//' "$file"
  fi
done

echo "✅ Stale dashboard imports auto-commented."