#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: ./UltraDeploy.sh
# Purpose: Full clean ➔ deploy ➔ monitor in one strike

echo -e "\n🛡️  AXPT Ultra Deploy Activated..."

# Step 1: Restore .temp files if any
echo -e "\n🔍 Checking for .temp files to restore..."
find . -type f -name '*.temp.ts' -exec bash -c 'mv "$0" "${0%.temp.ts}.ts"' {} \;
find . -type f -name '*.temp.tsx' -exec bash -c 'mv "$0" "${0%.temp.tsx}.tsx"' {} \;
echo "✅ All .temp files (if any) restored."

# Step 2: Git add everything
echo -e "\n📦 Staging all changes..."
git add .

# Step 3: Git status overview
echo -e "\n📋 Git status:"
git status -s

# Step 4: Prompt for commit message
echo -e "\n✏️  Enter commit message (or press ENTER for auto-timestamp):"
read COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="UltraDeploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Step 5: Git commit with safety check
echo -e "\n🖋️ Committing changes..."
if git diff --cached --quiet; then
  echo "⚠️  No changes staged. Nothing to commit."
  echo "🛑 Deploy aborted. No new changes to push."
  exit 0
else
  git commit -m "$COMMIT_MESSAGE"
fi

# Step 6: Git push
echo -e "\n🚀 Pushing to remote origin..."
git push

# Optional: Automatically open Vercel dashboard (uncomment if desired)
# open https://vercel.com/YOUR_PROJECT_NAME/deployments

# Step 7: Final message
echo -e "\n✅ Ultra Deploy Complete! Monitor your Vercel Dashboard 🌐"

exit 0