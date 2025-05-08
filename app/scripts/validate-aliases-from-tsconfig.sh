#!/bin/bash

# AXPT Script: validate-aliases-from-tsconfig.sh
# Dynamically checks if all alias paths in tsconfig.json resolve to real folders

TS_CONFIG="tsconfig.json"
echo "🔍 Validating paths from $TS_CONFIG..."

# Extract alias keys and their paths from tsconfig.json
jq -r '.compilerOptions.paths | to_entries[] | "\(.key) \(.value[0])"' "$TS_CONFIG" | while read -r alias rawPath; do
  # Clean alias (e.g., "@/lib/*" → "@/lib") and path (e.g., "lib/*" → "lib")
  aliasName=$(echo "$alias" | sed 's|/\*||g')
  cleanPath=$(echo "$rawPath" | sed 's|/\*||g' | sed 's|^\.\./||') # removes ../ if present

  if [ -d "$cleanPath" ]; then
    echo "✅ $aliasName → $cleanPath exists"
  else
    echo "❌ $aliasName → $cleanPath is missing"
  fi
done