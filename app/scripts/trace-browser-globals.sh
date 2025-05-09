#!/bin/bash

# === AXPT | Trace Unsafe Browser Global Usage in Import Tree ===
# Target: ./app/partner/whitepaper/page.tsx
# Usage: ./app/scripts/trace-browser-globals.sh

TARGET_FILE="app/partner/whitepaper/page.tsx"
ROOT_DIR="app"
TMP_LOG="logs/_trace_browser_usage.txt"
mkdir -p logs
> "$TMP_LOG"

echo "🔎 Tracing import tree for browser-global violations in: $TARGET_FILE"
echo "------------------------------------------------------------" | tee -a "$TMP_LOG"

get_imports_recursive() {
  local file="$1"
  local visited="$2"

  if grep -q "$file" <<< "$visited"; then return; fi
  visited="$visited $file"

  # Extract imports
  imports=$(grep "^import" "$file" | grep -oE "[\"'](.*?)[\"']" | tr -d "\"'")

  for imp in $imports; do
    # Skip built-ins and packages
    if [[ "$imp" == http* || "$imp" == react* || "$imp" == next* || "$imp" == framer-motion* || "$imp" == @mui* ]]; then
      continue
    fi

    # Resolve relative imports
    if [[ "$imp" == .* ]]; then
      imp_path=$(dirname "$file")/"$imp"
      if [ -f "${imp_path}.tsx" ]; then resolved="${imp_path}.tsx"
      elif [ -f "${imp_path}.ts" ]; then resolved="${imp_path}.ts"
      elif [ -f "${imp_path}/index.tsx" ]; then resolved="${imp_path}/index.tsx"
      else continue
      fi

      # Check for violations
      scan_for_browser_globals "$resolved"
      get_imports_recursive "$resolved" "$visited"
    fi
  done
}

scan_for_browser_globals() {
  local file="$1"
  local rel_path="${file#$ROOT_DIR/}"

  globals=$(grep -E "document|window|localStorage" "$file" || true)
  if [[ -n "$globals" ]]; then
    echo "⚠️  $rel_path uses browser globals:" | tee -a "$TMP_LOG"
    grep -nE "document|window|localStorage" "$file" | tee -a "$TMP_LOG"

    # Suggest fix
    if ! grep -q "'use client'" "$file"; then
      echo "   💡 Suggestion: Add 'use client' at the top of $rel_path" | tee -a "$TMP_LOG"
    fi
    echo "   💡 Suggestion: Wrap usage with typeof guard (e.g., if (typeof window !== 'undefined') {...})" | tee -a "$TMP_LOG"
    echo "" | tee -a "$TMP_LOG"
  fi
}

echo "📁 Walking dependency tree from $TARGET_FILE..."
get_imports_recursive "$TARGET_FILE"

echo "✅ Scan complete. Review browser usage in:"  
echo "   $TMP_LOG"