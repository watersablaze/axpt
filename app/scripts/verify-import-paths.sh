#!/bin/bash

echo "🔍 Verifying import paths..."

BASE_DIR=$(pwd)
TARGET_DIRS=("app" "components" "lib")
LOG_FILE="logs/verify_imports_$(date +'%Y-%m-%d_%H-%M-%S').log"
mkdir -p logs
> "$LOG_FILE"

for dir in "${TARGET_DIRS[@]}"; do
  find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    grep -oP "from ['\"]\K[^'\"]+" "$file" | while read -r importPath; do
      resolvedPath="$BASE_DIR/$importPath"
      if [[ "$importPath" == @/* ]]; then
        # Handle path aliases starting with "@/"
        resolvedPath="$BASE_DIR/src/${importPath#@/}"
      elif [[ "$importPath" != .* && "$importPath" != /* ]]; then
        continue # likely a package import
      elif [[ "$importPath" == .* ]]; then
        resolvedPath="$(dirname "$file")/$importPath"
      fi

      # Try resolving the file with possible extensions
      if ! ls "$resolvedPath".{ts,tsx,js,json} &>/dev/null; then
        echo "❌ Missing: '$importPath' in $file" | tee -a "$LOG_FILE"
      fi
    done
  done
done

echo "✅ Verification complete. Log saved to $LOG_FILE"