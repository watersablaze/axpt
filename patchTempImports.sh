#!/bin/bash

echo "🔧 Patching import statements to use .temp.ts modules..."

# Target directory to scan (you can adjust this as needed)
TARGET_DIR="./app"

# Extensions to scan
EXTENSIONS=("ts" "tsx")

# Loop through each file type
for ext in "${EXTENSIONS[@]}"; do
  find "$TARGET_DIR" -type f -name "*.$ext" | while read -r file; do
    if grep -q "@/lib/" "$file"; then
      echo "🛠️  Patching: $file"
      sed -i '' 's|@/lib/\([^"]*\)"|@/lib/\1.temp"|g' "$file"

      # Add a top comment if not already present
      if ! grep -q "// 🔁 TEMP PATCHED IMPORTS" "$file"; then
        sed -i '' '1s|^|// 🔁 TEMP PATCHED IMPORTS — will be reverted after clean build\n\n|' "$file"
      fi
    fi
  done
done

echo "✅ All imports pointing to '@/lib/*.temp' now."