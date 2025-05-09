#!/bin/bash

LOG_DIR=".axpt"
LOG_FILE="$LOG_DIR/patch-log.json"
TARGET_DIR="./app"
EXTENSIONS=("ts" "tsx")

mkdir -p "$LOG_DIR"

function log_action() {
  local file="$1"
  local mode="$2" # PATCH or RESTORE
  echo "{\"file\": \"$file\", \"mode\": \"$mode\", \"timestamp\": \"$(date +"%Y-%m-%d %H:%M:%S")\"}" >> "$LOG_FILE"
}

function patch_files() {
  echo "🛡️  Patching imports to .temp modules..."
  for ext in "${EXTENSIONS[@]}"; do
    find "$TARGET_DIR" -type f -name "*.$ext" | while read -r file; do
      if grep -q "@/lib/.*\"" "$file"; then
        echo "🔒 Patching: $file"
        sed -i '' 's|@/lib/\([^"]*\)"|@/lib/\1.temp"|g' "$file"
        sed -i '' '1s|^|// 🔁 TEMP PATCHED IMPORTS\n|' "$file"
        log_action "$file" "PATCH"
      fi
    done
  done
  echo "✅ All matching imports patched."
}

function restore_files() {
  echo "♻️  Restoring patched imports to original modules..."
  for ext in "${EXTENSIONS[@]}"; do
    find "$TARGET_DIR" -type f -name "*.$ext" | while read -r file; do
      if grep -q "@/lib/.*\.temp" "$file"; then
        echo "🔄 Restoring: $file"
        sed -i '' 's|@/lib/\([^"]*\)\.temp"|@/lib/\1"|g' "$file"
        sed -i '' '/\/\/ 🔁 TEMP PATCHED IMPORTS/d' "$file"
        log_action "$file" "RESTORE"
      fi
    done
  done
  echo "✅ All imports restored."
}

echo "🔁 PATCH MODULE TOGGLE"
echo "1) Patch all imports to .temp"
echo "2) Restore imports to original"
echo "3) Exit"
read -p "Choose an option (1/2/3): " option

case $option in
  1) patch_files ;;
  2) restore_files ;;
  3) echo "👋 Exiting." ;;
  *) echo "❌ Invalid option." ;;
esac