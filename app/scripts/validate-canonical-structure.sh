#!/bin/bash

# === AXPT | Canonical Structure Validator ===
# Usage: chmod +x validate-canonical-structure.sh && ./validate-canonical-structure.sh

echo "🔍 Validating canonical app/src structure and aliases..."

missing=0

check_path() {
  local label=$1
  local path=$2
  if [ -d "$path" ]; then
    echo "✅ $label → $path exists"
  else
    echo "❌ $label → $path is MISSING"
    missing=$((missing+1))
  fi
}

check_path "@/components" "app/src/components"
check_path "@/lib"        "app/src/lib"
check_path "@/lotties"    "app/src/lotties"

echo ""
echo "🔧 Checking tsconfig.json baseUrl and paths..."

baseUrl=$(jq -r '.compilerOptions.baseUrl' tsconfig.json)
if [[ "$baseUrl" == "app/src" ]]; then
  echo "✅ baseUrl is correctly set to app/src"
else
  echo "❌ baseUrl is not app/src → Found: $baseUrl"
  missing=$((missing+1))
fi

echo ""
if [[ $missing -eq 0 ]]; then
  echo "🎯 Canonical structure and alias config are valid. You are ready to build."
else
  echo "⚠️ Some paths or config values are incorrect. Please fix before continuing."
fi