#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: fullDeploy.sh (Interactive Commit Version)
# Purpose: Stage ➔ Commit ➔ Push with option to add custom commit messages

# 1. Stage all changes
echo "\n🚀 Staging all changes..."
git add .

# 2. Prompt for custom commit message
read -p "✏️  Enter commit message (or leave blank for timestamped message): " COMMIT_MESSAGE

# 3. Use timestamp if no message provided
if [ -z "$COMMIT_MESSAGE" ]; then
  COMMIT_MESSAGE="Full Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 4. Commit
echo "\n✏️  Committing with message: '$COMMIT_MESSAGE'..."
git commit -m "$COMMIT_MESSAGE"

# 5. Push
echo "\n📤 Pushing to remote..."
git push

# 6. Deploy successful (if no errors)
echo "\n✅ Deployment process complete! Monitor your Vercel Dashboard to confirm.\n"