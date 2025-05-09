#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: ./UltraDeploy.sh
# Purpose: Full clean ➔ deploy ➔ monitor in one strike

echo "\n🛡️  AXPT Ultra Deploy Activated..."

# Step 1: Restore .temp files if any
echo "\n🔍 Checking for .temp files to restore..."
find . -type f -name '*.temp.ts' -exec bash -c 'mv "$0" "${0%.temp.ts}.ts"' {} \;
find . -type f -name '*.temp.tsx' -exec bash -c 'mv "$0" "${0%.temp.tsx}.tsx"' {} \;

echo "✅ All .temp files (if any) restored."

# Step 2: Git add everything
echo "\n📦 Staging all changes..."
git add .

# Step 3: Prompt for commit message
echo "\n✏️  Enter commit message (or press ENTER for auto-timestamp):"
read COMMIT_MESSAGE

if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="UltraDeploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Step 4: Git commit with check
echo "\n🖋️ Committing changes..."
if git diff --cached --quiet; then
  echo "⚠️  No changes staged. Nothing to commit."
  echo "🛑 Deploy aborted. No new changes to push."
  exit 0
else
  git commit -m "$COMMIT_MESSAGE"
fi

# Step 5: Git push
echo "\n🚀 Pushing to remote origin..."
git push

# Step 6: Final message
echo "\n✅ Ultra Deploy Complete! Monitor your Vercel Dashboard 🌐"

exit 0