#!/bin/bash

echo ""
echo "🌀 Starting AXPT Full Deployment Ritual — $(date)"
echo "──────────────────────────────────────────────"

# Step 1: Run Preflight Checks
echo "🔍 Running ultraPreflightDeploy..."
pnpm ultraPreflightDeploy || {
  echo "❌ Preflight failed. Aborting."
  exit 1
}

# Step 2: Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel (Production)..."
pnpm vercel --prod || {
  echo "❌ Vercel deployment failed."
  exit 1
}

echo ""
echo "✅ AXPT Deployment Complete — $(date)"
echo "========================================="