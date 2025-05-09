#!/bin/bash

echo "📁 Verifying required file paths..."

# List of files to check
REQUIRED_FILES=(
  "app/dashboard/Dashboard.module.css"
  "components/OrbAnimation.tsx"
  "src/lotties/Axis_Orb.json"
  "app/styles/globals.css"
)

ALL_PRESENT=true

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "✅ Found: $FILE"
  else
    echo "❌ Missing: $FILE"
    ALL_PRESENT=false
  fi
done

if [ "$ALL_PRESENT" = true ]; then
  echo "🎯 All required files are present."
else
  echo "⚠️ One or more required files are missing."
fi