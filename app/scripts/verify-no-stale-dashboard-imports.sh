#!/bin/bash

echo "🔍 Verifying no stale dashboard imports remain..."

STALE_PATTERNS=(
  "@/app/dashboard/Dashboard.module.css"
  "styles.dashboard"
  "/dashboard" # e.g., router.push("/dashboard")
)

FOUND=false

for pattern in "${STALE_PATTERNS[@]}"; do
  MATCHES=$(grep -rn "$pattern" ./app 2>/dev/null)
  if [[ -n "$MATCHES" ]]; then
    echo "🚨 Found stale pattern '$pattern':"
    echo "$MATCHES"
    FOUND=true
  fi
done

if [ "$FOUND" = false ]; then
  echo "✅ No stale dashboard imports or references found."
else
  echo "⚠️  Please review and clean the above references manually or run the cleanup script again."
fi