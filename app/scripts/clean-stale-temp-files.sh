#!/bin/bash

# === AXPT | DEPLOY RITUAL ===
# Last Updated: 2025-05-09
# Description: Cleans Prisma/Stripe-blocking files → deploys → restores .temp.ts[x] files.

echo "🧹 Step 1: Cleansing Prisma + Stripe linked routes..."
./UltraPatchPrisma.sh

echo ""
echo "🚀 Step 2: Deploying to Vercel via Git Push..."
./UltraDeploy.sh

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed. Skipping restoration of temp files."
  exit 1
fi

echo ""
echo "🧼 Step 3: Restoring any .temp.ts[x] files..."
./clean-stale-temp-files.sh

echo ""
echo "✅ Deployment + file restoration complete. Check your Vercel dashboard."