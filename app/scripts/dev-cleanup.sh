#!/bin/bash

echo "🚀 AXPT Dev Cleanup Routine Starting..."

# Step 1: Clean Next.js cache
echo "🧹 Removing .next directory..."
rm -rf .next

# Step 2: Clean Node Modules
echo "🧹 Removing node_modules..."
rm -rf node_modules

# Step 3: Clear NPM cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Step 4: Clear system-level caches (macOS)
echo "🧹 Clearing system cache directories..."
rm -rf ~/Library/Caches/*
rm -rf ~/Library/Application\ Support/Code/Cache/*
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Application\ Cache/*
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Step 5: Clear logs
echo "🧹 Clearing system logs..."
sudo rm -rf /private/var/log/*

# Step 6: Confirm size reduction
echo "📊 Disk usage after cleanup:"
df -h

echo "✅ Done. You may now run: npm install && npm run dev"