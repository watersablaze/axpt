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
  echo "💡 Tip: nvm install $EXPECTED_NODE && nvm use $EXPECTED_NODE"
  exit 1
else
  echo "✅ Node.js version locked: $NODE_VERSION"
fi

# Check PNPM version
if [ "$PNPM_VERSION" != "$EXPECTED_PNPM" ]; then
  echo "❌ PNPM version mismatch:"
  echo "   Expected: $EXPECTED_PNPM"
  echo "   Found:    $PNPM_VERSION"
  echo "💡 Tip: pnpm add -g pnpm@$EXPECTED_PNPM"
  exit 1
else
  echo "✅ PNPM version locked: $PNPM_VERSION"
fi

# Show git state
echo "📌 Git Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "🔖 Latest Commit: $(git rev-parse --short HEAD)"
echo "──────────────────────────────────────"

# Run env sync script
echo "🔐 Syncing .env with Vercel environment..."
pnpm exec tsx app/scripts/envsync.ts

# Run TypeScript checks
echo "🧪 Validating Types..."
pnpm tsc --noEmit || {
  echo "❌ TypeScript validation failed."
  exit 1
}

# Run production build
echo "🛠️  Building for production..."
pnpm build || {
  echo "❌ Build failed."
  exit 1
}

echo "✅ AXPT ultraPreflightDeploy complete."