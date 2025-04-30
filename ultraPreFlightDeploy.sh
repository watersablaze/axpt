#!/bin/bash

# === AXPT | Ultra Preflight + Deploy Ritual ===
# Timestamp: 2025-04-30 08:24:06
# chmod +x ultraPreflightDeploy.sh
# ./ultraPreflightDeploy.sh

echo "🔍 [1/4] Running TypeScript checks..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected. Fix before continuing."
  exit 1
fi

echo "✅ Type check passed."
echo ""

echo "🧪 [2/4] Running local Next.js production build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Investigate above errors."
  exit 1
fi

echo "✅ Build successful."
echo ""

read -p "🚀 [3/4] Go for launch? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "🛑 Launch aborted by operator."
  exit 0
fi

echo "🛠️ [4/4] Executing Deploy Ritual..."
./deployritual
