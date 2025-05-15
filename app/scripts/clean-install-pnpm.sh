#!/bin/bash

# chmod +x app/scripts/clean-install-pnpm.sh
# pnpm clean 

echo "🧹 Starting pnpm clean install for AXPT..."

# Abort on any error
set -e

# Step 1: Remove artifacts
echo "🗑️ Removing node_modules, .next, and lockfiles..."
rm -rf node_modules .next dist .turbo
rm -f package-lock.json yarn.lock
rm -rf ~/.pnpm-store || true

# Step 2: Clean pnpm store
echo "📦 Cleaning pnpm store..."
pnpm store prune

# Step 3: Reinstall deps
echo "📦 Reinstalling dependencies with pnpm..."
pnpm install --prefer-offline --frozen-lockfile

# Step 4: Build check
echo "🛠️ Running build..."
pnpm build

# Step 5: Optionally test dev startup
echo "🚀 Starting dev server (test)..."
pnpm dev

echo "✅ Clean install complete."