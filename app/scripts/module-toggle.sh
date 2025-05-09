#!/bin/bash

# ./app/scripts/module-toggle.sh

echo ""
echo "📦 AXPT Module Toggle"
echo "-------------------------"
echo "1) Patch modules (rename to .temp.ts + update imports)"
echo "2) Restore modules (rename .temp.ts → .ts + fix imports)"
echo "3) Exit"
echo "-------------------------"
read -p "Choose an option (1/2/3): " choice

# Directories to scan
TARGET_DIRS=("app" "lib")
EXTENSIONS=("ts" "tsx")

if [ "$choice" == "1" ]; then
  echo ""
  echo "🔒 Patching modules for clean deploy..."

  for dir in "${TARGET_DIRS[@]}"; do
    for ext in "${EXTENSIONS[@]}"; do
      find "$dir" -type f -name "*.$ext" | while read -r file; do
        # Check for specific lib/app imports (you can expand this as needed)
        if grep -qE '@/lib/stripe|@/lib/prisma|@/app/api' "$file"; then
          echo "📍 Patching: $file"
          sed -i '' 's|@/lib/\([^"]*\)"|@/lib/\1.temp"|g' "$file"
          sed -i '' 's|@/app/\([^"]*\)"|@/app/\1.temp"|g' "$file"
          sed -i '' '1s|^|// 🔁 TEMP PATCHED IMPORTS\n|' "$file"
        fi
      done
    done
  done

  for dir in "${TARGET_DIRS[@]}"; do
    find "$dir" -type f \( -name "prisma.ts" -o -name "stripe.ts" \) | while read -r originalFile; do
      tempFile="${originalFile/.ts/.temp.ts}"
      echo "📄 Renaming: $originalFile → $tempFile"
      mv "$originalFile" "$tempFile"
    done
  done

  echo "✅ Modules patched and ready for clean deploy."

elif [ "$choice" == "2" ]; then
  echo ""
  echo "♻️  Restoring original module names and imports..."

  for dir in "${TARGET_DIRS[@]}"; do
    find "$dir" -type f -name "*.temp.ts" -o -name "*.temp.tsx" | while read -r tempFile; do
      originalFile="${tempFile/.temp/}"
      echo "🔁 Renaming: $tempFile → $originalFile"
      mv "$tempFile" "$originalFile"
    done
  done

  for dir in "${TARGET_DIRS[@]}"; do
    for ext in "${EXTENSIONS[@]}"; do
      find "$dir" -type f -name "*.$ext" | while read -r file; do
        if grep -q '\.temp' "$file"; then
          echo "🧽 Cleaning imports in: $file"
          sed -i '' 's|@/lib/\([^"]*\)\.temp"|@/lib/\1"|g' "$file"
          sed -i '' 's|@/app/\([^"]*\)\.temp"|@/app/\1"|g' "$file"
          sed -i '' 's|from "\([^"]*\)\.temp"|from "\1"|g' "$file"
          sed -i '' '/\/\/ 🔁 TEMP PATCHED IMPORTS/d' "$file"
        fi
      done
    done
  done

  echo "✅ All modules restored to original state."

else
  echo "👋 Exiting."
  exit 0
fi