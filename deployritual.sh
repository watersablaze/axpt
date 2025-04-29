#!/bin/bash

# === AXPT | DEPLOY RITUAL ===
# Last Generated: 2025-04-29 20:18:19
# Description: Cleans prisma/stripe-blocking files + commits and deploys.

echo "🧹 Step 1: Cleansing Prisma + Stripe linked routes..."
./UltraPatchPrisma.sh

echo ""
echo "🚀 Step 2: Deploying to Vercel via Git Push..."
./UltraDeploy.sh

echo ""
echo "✅ Done! Check your Vercel Dashboard to confirm."
