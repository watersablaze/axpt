#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: fastStatus.sh
# Purpose: Quick overview of repo health

echo "\n🛡️ Checking Git Status..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)

echo "\n🌿 Current Branch: $BRANCH"

if [ "$UPSTREAM" ]; then
  git remote update > /dev/null 2>&1
  echo "\n🔗 Tracking Remote: $UPSTREAM"
  git status
else
  echo "\n⚠️ No remote tracking branch found. (Maybe new branch?)"
fi

echo "\n✅ Fast status check complete.\n"