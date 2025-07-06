#!/bin/bash

echo "🔍 Running Ultra Preflight Checks..."

# Exit on first error
set -e

# 1. Run Prisma format + validate
echo "🧬 Formatting and validating Prisma schema..."
pnpm prisma format
pnpm prisma validate

# 2. Run typecheck
echo "📘 Running TypeScript checks..."
pnpm typecheck

# 3. Build the project
echo "🏗️  Running build..."
pnpm build

echo "✅ Ultra Preflight Checks Passed. Ready to deploy."