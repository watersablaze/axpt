#!/bin/bash

echo "🔧 Scanning partner CLI scripts for missing dotenv import..."

TARGET_DIR="./app/scripts/partner"

# Find all .ts files directly inside the directory (excluding utils/)
find "$TARGET_DIR" -maxdepth 1 -name "*.ts" | while read -r file; do
  if grep -q "import 'dotenv/config';" "$file"; then
    echo "✅ Already patched: $file"
  else
    echo "🛠  Patching dotenv import into: $file"
    tmpfile=$(mktemp)
    echo "import 'dotenv/config';" > "$tmpfile"
    cat "$file" >> "$tmpfile"
    mv "$tmpfile" "$file"
  fi
done

echo "🎉 All applicable scripts are now patched."