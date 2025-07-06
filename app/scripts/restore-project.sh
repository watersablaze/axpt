#!/bin/bash

echo "🧼 AXPT Restoration Ritual Initiated..."
echo "========================================"

echo "🔁 Removing node_modules, lockfile, and turbo cache..."
rm -rf node_modules pnpm-lock.yaml .turbo

echo "🧹 Pruning pnpm global store cache..."
pnpm store prune

echo "⚙️ Updating .npmrc for stable registry and retries..."
cat <<EOF > .npmrc
registry=https://registry.npmjs.org/
fetch-retries=3
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000
prefer-offline=true
EOF

echo "📦 Reinstalling dependencies (with prefer-offline and limited concurrency)..."
pnpm install --prefer-offline --child-concurrency=3 || {
  echo "❌ pnpm install failed. Consider checking your internet or trying with --no-optional"
  exit 1
}

echo "✅ Ritual complete. Project dependencies restored."