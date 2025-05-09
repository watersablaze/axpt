#!/bin/bash

# === AXPT | Promote Staging to Production ===
# Usage: chmod +x app/scripts/promote-to-production.sh && ./app/scripts/promote-to-production.sh

set -e

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
backup_branch="backup-master-before-temp-merge-$timestamp"

PRODUCTION_DOMAIN="https://axpt.io"
VERCEL_DASHBOARD_URL="https://vercel.com/dashboard"

echo "🔁 Switching to master branch..."
git checkout master

echo "🔄 Pulling latest from origin/master..."
git pull origin master

echo "📦 Creating backup branch: $backup_branch"
git checkout -b "$backup_branch"

echo "🔁 Switching back to master for merge..."
git checkout master

echo "🔀 Merging temp-clean-deploy into master..."
git merge temp-clean-deploy --no-ff -m "🔀 Promote temp-clean-deploy to master [$timestamp]"

echo "🚀 Pushing master to origin (this triggers Vercel production deployment)..."
git push origin master

echo ""
echo "📂 Restoring any .temp.ts or .temp.tsx files if present..."
find . -type f -name '*.temp.ts' -exec bash -c 'mv "$0" "${0%.temp.ts}.ts"' {} \;
find . -type f -name '*.temp.tsx' -exec bash -c 'mv "$0" "${0%.temp.tsx}.tsx"' {} \;

echo ""
echo "🛠️ Running final build validation..."
pnpm run build

echo "📤 Pushing final restored + validated state..."
git add .
git commit -m "✅ Final push after promoting temp-clean-deploy and restoring .temp files [$timestamp]"
git push origin master

echo ""
echo "🌐 Opening Vercel dashboard and production domain..."

if command -v open &> /dev/null; then
  open "$PRODUCTION_DOMAIN"
  open "$VERCEL_DASHBOARD_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$PRODUCTION_DOMAIN"
  xdg-open "$VERCEL_DASHBOARD_URL"
else
  echo "🔗 Please open manually:"
  echo "🔗 $PRODUCTION_DOMAIN"
  echo "🔗 $VERCEL_DASHBOARD_URL"
fi

echo ""
echo "✅ Promotion complete. Monitor your production domain or Vercel Dashboard."