#!/bin/bash

echo "🚀 Running Full Deploy Ritual..."

# Exit on error
set -e

# 1. Run Ultra Preflight
echo "🔍 Running Ultra Preflight Script..."
./bin/ultraPreflightDeploy.sh

# 2. Push to Git
echo "🌀 Committing and pushing to Git..."
git add .
git commit -m "🚀 Full deploy via FullDeploy script"
git push origin main

# 3. Deploy to Vercel
echo "🌐 Triggering Vercel Deploy..."
vercel --prod

echo "🎉 Full Deployment Complete!"
