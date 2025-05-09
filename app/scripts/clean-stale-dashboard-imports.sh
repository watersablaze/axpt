#!/bin/bash

echo "🧹 Cleaning up stale dashboard references..."

TARGET_FILES=$(grep -rl "@/app/dashboard/Dashboard.module.css" app || true)

for file in $TARGET_FILES; do
  echo "🛠️  Cleaning: $file"
  # Comment out stale CSS import
  sed -i '' 's|// 🚫 Stale import (auto-commented): from "@/app/dashboard/Dashboard.module.css";

  # Comment out all references to /* styles.dashboard 🚫 stale */
  sed -i '' 's/styles\.dashboard/\/\* /* styles.dashboard 🚫 stale */ 🚫 stale \*\//g' "$file"
done

# Extra: Remove or comment references to page.tsx if they exist elsewhere
grep -rl "// 🚫 dashboard/page stale reference" app | while read -r file; do
  echo "🧽 Removing // 🚫 dashboard/page stale reference reference in $file"
  sed -i '' 's|// 🚫 dashboard/page stale reference|// 🚫 // 🚫 dashboard/page stale reference stale reference|g' "$file"
done

echo "✅ Stale dashboard references cleaned."