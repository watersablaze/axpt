#!/bin/bash

echo "🧼 AXPT Hardened Restoration Ritual Initiated..."
echo "=============================================="

# Step 1: Clean slate
echo "🔁 Removing node_modules, lockfile, turbo cache..."
rm -rf node_modules pnpm-lock.yaml .turbo .npmrc

echo "🧹 Pruning global PNPM store..."
pnpm store prune

# Step 2: Create clean .npmrc
echo "⚙️ Setting up fresh .npmrc..."
cat <<EOF > .npmrc
registry=https://registry.npmjs.org/
fetch-retries=2
fetch-retry-mintimeout=1000
fetch-retry-maxtimeout=2000
prefer-offline=true
EOF

# Step 3: Core install - minimal, safe, no postinstall
echo "📦 Installing core packages (react, next, types)..."
pnpm add --ignore-scripts react react-dom next

echo "📦 Installing dev types (typescript, @types)..."
pnpm add -D --ignore-scripts typescript @types/node @types/react @types/react-dom

# Step 4: Type validation
echo "🧪 Validating TypeScript setup..."
pnpm exec tsc --noEmit

echo ""
echo "✅ Restoration complete."
echo "📌 Next steps:"
echo "→ Gradually add other packages (e.g. tailwind, prisma) one by one"
echo "→ Watch for native module hangs or retry loops"