#!/bin/bash

# patch-all.sh - Run essential patch + verification routines for AXPT
# bash app/scripts/patch-all.sh

set -e

echo "🔧 Starting AXPT patch sequence..."

# Step 1: Patch dotenv import into CLI scripts
if [ -f "app/scripts/patch-dotenv-import.sh" ]; then
  echo "🔁 Patching dotenv into partner CLI scripts..."
  bash app/scripts/patch-dotenv-import.sh
else
  echo "⚠️  Missing patch-dotenv-import.sh — skipping."
fi

# Step 2: Run env verification
if [ -f "app/scripts/verify-env.sh" ]; then
  echo "🧪 Verifying environment variables..."
  bash app/scripts/verify-env.sh
else
  echo "⚠️  Missing verify-env.sh — skipping."
fi

# Step 3: Validate alias paths
if [ -f "app/scripts/validate-aliases-from-tsconfig.sh" ]; then
  echo "🔍 Validating path aliases from tsconfig.json..."
  bash app/scripts/validate-aliases-from-tsconfig.sh
else
  echo "⚠️  Missing validate-aliases-from-tsconfig.sh — skipping."
fi

# Step 4: Clean stale dashboard imports
if [ -f "app/scripts/clean-stale-dashboard-imports.sh" ]; then
  echo "🧹 Cleaning stale dashboard imports..."
  bash app/scripts/clean-stale-dashboard-imports.sh
else
  echo "⚠️  Missing clean-stale-dashboard-imports.sh — skipping."
fi

# Optional: Confirm .env loading in tsx CLI
echo "✅ Patch-all sequence completed. Review any warnings above."
