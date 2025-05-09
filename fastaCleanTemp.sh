#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: ./fastaCleanTemp.sh
# Purpose: Restore all .temp.ts, .temp.tsx files to their original names

echo ""
echo "🧹 Starting FASTA Clean-Up of .temp files..."

# Find and rename .temp.tsx files
find . -type f -name "*.temp.tsx" | while read file; do
  newFile=$(echo "$file" | sed 's/\.temp\.tsx$/.tsx/')
  echo "🔄 Restoring $file ➔ $newFile"
  mv "$file" "$newFile"
done

# Find and rename .temp.ts files
find . -type f -name "*.temp.ts" | while read file; do
  newFile=$(echo "$file" | sed 's/\.temp\.ts$/.ts/')
  echo "🔄 Restoring $file ➔ $newFile"
  mv "$file" "$newFile"
done

echo ""
echo "✅ FASTA Clean-Up complete!"
echo "✅ All .temp files have been restored to their original form."
echo ""