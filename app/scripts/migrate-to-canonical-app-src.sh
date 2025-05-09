#!/bin/bash

# === AXPT | Canonical app/src Migration Script ===
# Usage: chmod +x migrate-to-canonical-src.sh && ./migrate-to-canonical-src.sh

echo "🚚 Starting canonical migration to app/src..."

if [ -d "components" ]; then
  mkdir -p app/src/components
  mv components/* app/src/components/ 2>/dev/null || true
  rmdir components 2>/dev/null || true
fi

if [ -d "lib" ]; then
  mkdir -p app/src/lib
  mv lib/* app/src/lib/ 2>/dev/null || true
  rmdir lib 2>/dev/null || true
fi

if [ -d "src/lotties" ]; then
  mkdir -p app/src/lotties
  mv src/lotties/* app/src/lotties/ 2>/dev/null || true
  rmdir src/lotties 2>/dev/null || true
fi

echo "✅ Structure migrated to app/src. Run patch-aliases.sh to finalize."