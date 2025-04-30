#!/bin/bash

# === AXPT Arsenal Utility ===
# Script: commentALLErrors.sh
# Purpose: Comment out all known problematic lines in temp files using known keywords

echo "🔒 Commenting out known problematic lines in .temp.ts files..."

# Keywords known to trigger TS2304 errors when modules are missing
IDENTIFIERS=("stripe" "prisma" "authOptions" "tx" "contractAbi")

# Loop through all .temp.ts files and patch them
find . -type f -name "*.temp.ts" | while read -r file; do
  echo "🛠️  Patching: $file"
  for id in "${IDENTIFIERS[@]}"; do
    # Use sed to comment out lines with the keyword that are not already commented
    sed -i '' "/^[^\/]*\b$id\b/ s/^/\/\/ 🔒 Temporarily disabled: /" "$file"
  done
done

echo "✅ All matched identifiers in .temp.ts files have been commented."
