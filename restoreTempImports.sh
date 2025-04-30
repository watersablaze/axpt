#!/bin/bash

echo "♻️  Reverting .temp.ts imports back to original modules..."

# Target directory
TARGET_DIR="./app"

# File extensions to scan
EXTENSIONS=("ts" "tsx")

# Loop through each file type
for ext in "${EXTENSIONS[@]}"; do
  find "$TARGET_DIR" -type f -name "*.$ext" | while read -r file; do
    if grep -q "@/lib/.*\.temp" "$file"; then
      echo "🔄 Restoring: $file"
      sed -i '' 's|@/lib/\([^"]*\)\.temp"|@/lib/\1"|g' "$file"

      # Optionally remove the marker comment
      sed -i '' '/\/\/ 🔁 TEMP PATCHED IMPORTS/d' "$file"
    fi
  done
done

echo "✅ All .temp imports restored to original module paths."