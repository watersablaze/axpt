#!/bin/bash

# === AXPT Arsenal ===
# Script: patchCommentBlocksWithFallback.sh
# Purpose: Patch .temp.ts modules with a lock comment and fallback handler

echo "🛡️  Inserting lock comment + fallback into all .temp.ts modules..."

find . -type f -name '*.temp.ts' | while read -r file; do
  echo "🔒 Patching: $file"
  {
    echo '// 🔒 Temporarily disabled for clean deploy.'
    echo ''
    echo 'export async function POST() {'
    echo '  return new Response("🔒 Temporarily paused", { status: 503 });'
    echo '}'
  } > "$file"
done

echo "🎯 All comment blocks and fallbacks inserted."
