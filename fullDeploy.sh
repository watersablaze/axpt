#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: ./fullDeploy.sh
# Purpose: Full git add ➔ commit ➔ push flow in one fast command

# 1. Stage all changes
echo -e "\n🚀 Staging all changes..."
git add .

# 2. Prompt for custom commit message
read -p "✏️  Enter commit message (or leave blank for timestamped message): " userMessage

if [ -z "$userMessage" ]; then
  COMMIT_MESSAGE="Full Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
else
  COMMIT_MESSAGE="$userMessage"
fi

# 3. Commit
echo -e "\n✏️  Committing with message: '$COMMIT_MESSAGE'..."
git commit -m "$COMMIT_MESSAGE"

# 4. Push
echo -e "\n📤 Pushing to remote..."
git push

# 5. Complete
echo -e "\n✅ Deployment process complete! Monitor your Vercel Dashboard to confirm.\n"