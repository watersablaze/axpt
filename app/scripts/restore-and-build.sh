#!/bin/bash

echo "♻️  Restoring .temp.ts(x) modules and cleaning imports..."

TARGET_DIRS=("app" "lib")
EXTENSIONS=("ts" "tsx")

# 1. Rename .temp.ts/.temp.tsx → .ts/.tsx
for dir in "${TARGET_DIRS[@]}"; do
  find "$dir" -type f \( -name "*.temp.ts" -o -name "*.temp.tsx" \) | while read -r tempFile; do
    originalFile="${tempFile/.temp/}"
    echo "🔁 Renaming: $tempFile → $originalFile"
    mv "$tempFile" "$originalFile"
  done
done

# 2. Clean import paths
for dir in "${TARGET_DIRS[@]}"; do
  for ext in "${EXTENSIONS[@]}"; do
    find "$dir" -type f -name "*.$ext" | while read -r file; do
      if grep -q '\.temp' "$file"; then
        echo "🧼 Cleaning imports in: $file"
        sed -i '' 's|@/lib/\([^"]*\)\.temp"|@/lib/\1"|g' "$file"
        sed -i '' 's|@/app/\([^"]*\)\.temp"|@/app/\1"|g' "$file"
        sed -i '' 's|from "\([^"]*\)\.temp"|from "\1"|g' "$file"
        sed -i '' '/\/\/ 🔁 TEMP PATCHED IMPORTS/d' "$file"
      fi
    done
  done
done

# 3. Generate Prisma Client
echo "🔄 Running Prisma generate..."
npx prisma generate

# 4. Build project
echo "🏗️  Building project with pnpm..."
pnpm build

echo "✅ All modules restored and project rebuilt successfully."