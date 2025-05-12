#!/bin/bash

# === AXPT | Audit for Stale Dashboard Imports ===

echo "🔎 Scanning for stale 'dashboard' imports or page routes..."

matches=$(grep -rniE "import .*dashboard|['\"]\/dashboard['\"]" app/src || true)

if [[ -n "$matches" ]]; then
  echo "$matches"
  exit 1
else
  echo "✅ No stale dashboard imports found."
  exit 0
fi