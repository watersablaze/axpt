#!/bin/bash

# === AXPT | Guard useSession SSR Violations ===
# Scans app/ directory for .tsx files using useSession without SSR guard
# Adds SSR protection if missing.

logfile="logs/patch_useSession_guards_$(date +%Y-%m-%d_%H-%M-%S).log"
mkdir -p logs

echo "🔎 Scanning for useSession usage..." | tee -a "$logfile"

find ./app -name "*.tsx" | while read -r file; do
  if grep -q "useSession" "$file" && ! grep -q "typeof window === \"undefined\"" "$file"; then
    if grep -q 'export default function' "$file" && grep -q '"use client"' "$file"; then
      echo "⚠️  Patching SSR guard in: $file" | tee -a "$logfile"
      sed -i '' '/"use client";/a\
\
if (typeof window === "undefined") return null; // ✅ Prevent SSR crash\
' "$file"
    else
      echo "🚫 Skipped (no default function or use client): $file" | tee -a "$logfile"
    fi
  fi
  
  if grep -q "useSession" "$file" && ! grep -q '"use client"' "$file"; then
    echo "🚨 Missing 'use client': $file" | tee -a "$logfile"
  fi

done

echo "✅ SSR guards verified or patched where needed." | tee -a "$logfile"
