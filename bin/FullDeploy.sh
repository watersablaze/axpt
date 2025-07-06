#!/bin/bash

echo "⟁ AXPT | FullDeploy Ritual"
echo "──────────────────────────────────────────"

# 1. Run Ultra Preflight Check
echo "🌀 Running Ultra Preflight Deploy..."
bash bin/ultraPreflightDeploy.sh

if [ $? -ne 0 ]; then
  echo "❌ Preflight check failed. Aborting FullDeploy."
  exit 1
fi

# 2. Git Add & Commit
echo "📂 Staging changes..."
git add -A

read -p "📝 Enter commit message: " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
  echo "⚠️  No commit message entered. Aborting."
  exit 1
fi

echo "📦 Committing changes..."
git commit -m "$COMMIT_MSG"

# 3. Git Push
echo "🚀 Pushing to origin/master..."
git push origin master

if [ $? -ne 0 ]; then
  echo "❌ Git push failed. Please check your remote or branch name."
  exit 1
fi

# 4. Deployment complete
echo "🎉 Code pushed. Vercel should now auto-deploy."

echo "🔍 Monitor deployment: https://vercel.com/dashboard"
echo "──────────────────────────────────────────"
echo "✅ AXPT | FullDeploy Ritual complete"
echo "🕓 Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"