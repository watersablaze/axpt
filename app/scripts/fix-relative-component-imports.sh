#!/bin/bash

# === AXPT Arsenal ===
# Script: fix-relative-component-imports.sh
# Purpose: Replace all relative imports to components/ with @/components/

echo "🔧 Rewriting relative imports to '@/components/...'..."

find app -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  if grep -q "\.\./\.\./\.\./components/" "$file"; then
    sed -i '' 's|\.\./\.\./\.\./components/|@/components/|g' "$file"
    echo "✅ Updated: $file (../../../components)"
  fi
  if grep -q "\.\./\.\./components/" "$file"; then
    sed -i '' 's|\.\./\.\./components/|@/components/|g' "$file"
    echo "✅ Updated: $file (../../components)"
  fi
  if grep -q "\.\./components/" "$file"; then
    sed -i '' 's|\.\./components/|@/components/|g' "$file"
    echo "✅ Updated: $file (../components)"
  fi
done

echo "🎯 All matching relative imports patched."