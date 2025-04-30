#!/bin/bash

echo "🧹 Clearing .next build artifacts and types..."

# Remove local build cache
rm -rf .next

# Reconfirm with TypeScript
echo "🔍 Verifying TypeScript status post-clean..."
npx tsc --noEmit

echo "✅ .next cache cleared. TypeScript checked."