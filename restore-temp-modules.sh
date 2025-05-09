#!/bin/bash

#./app/scripts/restore-temp-modules.sh

echo "♻️  Reverting .temp.ts and .temp.tsx module references..."

# Directories to scan
TARGET_DIRS=("app" "lib")
EXTENSIONS=("ts" "tsx")

# Restore file names
for dir in "${TARGET_DIRS[@]}"; do
  find "$dir" -type f -name "*.temp.ts" -o -name "*.temp.tsx" | while read -r tempFile; do
    originalFile="${tempFile/.temp/}"
    echo "🔁 Renaming: $tempFile → $originalFile"
    mv "$tempFile" "$originalFile"
  done
done

# Restore import paths
for dir in "${TARGET_DIRS[@]}"; do
  for ext in "${EXTENSIONS[@]}"; do
    find "$dir" -type f -name "*.$ext" | while read -r file; do
      if grep -q '\.temp' "$file"; then
        echo "🧽 Cleaning imports in: $file"
        sed -i '' 's|@/lib/\([^"]*\)\.temp"|@/lib/\1"|g' "$file"
        sed -i '' 's|@/app/\([^"]*\)\.temp"|@/app/\1"|g' "$file"
        sed -i '' 's|from "\([^"]*\)\.temp"|from "\1"|g' "$file"

        # Clean temp marker comments if any
        sed -i '' '/\/\/ 🔁 TEMP PATCHED IMPORTS/d' "$file"
      fi
    done
  done
done

echo "✅ All temp modules and import paths restored."