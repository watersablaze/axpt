#!/bin/bash

echo "⟁ AXPT | ultraPreflightDeploy Ritual"
echo "──────────────────────────────────────"
echo "🔍 Verifying Environment Versions..."

EXPECTED_NODE="v20.11.1"
EXPECTED_PNPM="8.15.5"
NODE_VERSION=$(node -v)
PNPM_VERSION=$(pnpm -v)

# Check Node.js version
if [ "$NODE_VERSION" != "$EXPECTED_NODE" ]; then
  echo "❌ Node.js version mismatch:"
  echo "   Expected: $EXPECTED_NODE"
  echo "   Found:    $NODE_VERSION"
  echo "💡 Tip: Use \`nvm install $EXPECTED_NODE && nvm use $EXPECTED_NODE\` to match."
  exit 1
else
  echo "✅ Node.js version locked: $NODE_VERSION"
fi

# Check PNPM version
if [ "$PNPM_VERSION" != "$EXPECTED_PNPM" ]; then
  echo "❌ PNPM version mismatch:"
  echo "   Expected: $EXPECTED_PNPM"
  echo "   Found:    $PNPM_VERSION"
  echo "💡 Tip: Run \`pnpm add -g pnpm@$EXPECTED_PNPM\` to sync version."
  exit 1
else
  echo "✅ PNPM version locked: $PNPM_VERSION"
fi

# Git status
BRANCH=$(git rev-parse --abbrev-ref HEAD)
COMMIT=$(git rev-parse --short HEAD)
echo "📌 Branch:  $(tput bold)$BRANCH$(tput sgr0)"
echo "🔖 Commit:  $(tput bold)$COMMIT$(tput sgr0)"
echo "──────────────────────────────────────"

# .env validation
echo "🔐 Verifying environment variables..."
if [ ! -f ./app/scripts/verify-env.sh ]; then
  echo "❌ Missing script: app/scripts/verify-env.sh"
  exit 1
fi
bash ./app/scripts/verify-env.sh || exit 1

# .env sync (optional)
if [ -f app/scripts/envsync.ts ]; then
  echo "🔐 Syncing .env with Vercel environment..."
  pnpm exec tsx app/scripts/envsync.ts
else
  echo "ℹ️  No envsync.ts script found. Skipping env sync step."
fi

# TypeScript check
echo "🧪 Validating Types..."
pnpm tsc --noEmit || {
  echo "❌ TypeScript validation failed."
  exit 1
}

# Build
echo "🛠️  Building for production..."
pnpm build || {
  echo "❌ Build failed."
  exit 1
}

echo "✅ AXPT ultraPreflightDeploy complete — $(date -u +"%Y-%m-%d %H:%M:%SZ") 🌐"