#!/bin/bash

# === AXPT Arsenal ===
# Script: fix-component-imports.sh
# Purpose: Update raw `components/...` imports to `@/components/...`

echo "🔧 Fixing raw 'components/' imports to '@/components/'..."

find app -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  if grep -q 'from ["'\'']components/' "$file"; then
    echo "🛠️  Updating: $file"
    sed -i '' 's|from ["'\'']components/|from "@/components/|g' "$file"
  fi
done

echo "✅ Component import paths patched."