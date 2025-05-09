#!/bin/bash

# === AXPT | Auto-fix missing "use client" for useSession ===
# Usage: chmod +x app/scripts/fix-useSession-client.sh && app/scripts/fix-useSession-client.sh

echo "🔧 Scanning for 'useSession' imports missing 'use client'..."

FIXED_FILES=()

find app/ -type f -name "*.tsx" | while read -r file; do
  if grep -q "useSession" "$file"; then
    if ! head -n 5 "$file" | grep -q '"use client"'; then
      echo "🩹 Patching: $file"
      
      # Extract lines until we find the first non-comment/non-blank line
      awk 'BEGIN {patched=0}
        {
          if (!patched && $0 !~ /^[[:space:]]*\/\/.*$/ && $0 !~ /^[[:space:]]*$/) {
            print "\"use client\";\n" $0;
            patched=1;
          } else {
            print $0;
          }
        }' "$file" > "$file.patched"

      mv "$file.patched" "$file"
      FIXED_FILES+=("$file")
    fi
  fi
done

if [ ${#FIXED_FILES[@]} -eq 0 ]; then
  echo "✅ No missing 'use client' found."
else
  echo "✅ Patched files:"
  for f in "${FIXED_FILES[@]}"; do
    echo "  - $f"
  done
fi