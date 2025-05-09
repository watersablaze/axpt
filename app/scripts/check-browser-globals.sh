#!/bin/bash

# === AXPT | SSR Global Access Scanner ===
# Scans for 'document', 'window', 'localStorage', 'sessionStorage' usage in .tsx files
# Ensures they're wrapped in 'use client' and/or proper safety checks

echo "🔎 Scanning for improper use of browser-only globals (SSR unsafe)..."
echo

TARGETS=("document" "window" "localStorage" "sessionStorage")
VIOLATIONS=()

# Find all .tsx files
FILES=$(find app/ -type f -name "*.tsx")

for file in $FILES; do
  for term in "${TARGETS[@]}"; do
    if grep -q "\b$term\b" "$file"; then
      # Check if 'use client' is in the first 5 lines
      if ! head -n 5 "$file" | grep -q '"use client"'; then
        VIOLATIONS+=("$file → uses '$term' without 'use client'")
      fi
    fi
  done
done

if [ ${#VIOLATIONS[@]} -eq 0 ]; then
  echo "✅ No unsafe browser-global usage found. All good!"
else
  echo "⚠️ Detected potential SSR violations:"
  for v in "${VIOLATIONS[@]}"; do
    echo "  - $v"
  done

  echo
  echo "💡 To fix these issues:"
  echo "   → Ensure 'use client' appears at the top of each violating file."
  echo "   → OR wrap usage like so:"
  echo
  echo "     if (typeof window !== 'undefined') { /* safe window usage */ }"
  echo "     if (typeof document !== 'undefined') { /* safe DOM usage */ }"
  echo
  exit 1
fi