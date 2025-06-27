#!/bin/bash

echo "🔍 Running Ultra Preflight Checks..."

# Exit on first error
set -e

# 1. Validate environment variables
echo "✅ Checking environment variables..."
pnpm run verify-env

# 2. Run Prisma format + validate
echo "🧬 Formatting and validating Prisma schema..."
pnpm prisma format
pnpm prisma validate

# 3. Run typecheck
echo "📘 Running TypeScript checks..."
pnpm typecheck

# 4. Build the project
echo "🏗️  Running build..."
pnpm build

# 5. Run deploy verification script
echo "🔐 Verifying deploy artifacts..."
pnpm tsx scripts/verify-deploy-status.ts

echo "✅ Ultra Preflight Checks Passed. Ready to deploy."
