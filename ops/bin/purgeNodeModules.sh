#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: purgeNodeModules.sh
# Purpose: Clean and reinstall Node environment

echo "\n🔥 Deleting node_modules and package-lock.json..."
rm -rf node_modules package-lock.json

echo "\n📦 Reinstalling fresh dependencies..."
npm install

echo "\n✅ Node environment refreshed! You may now run:"
echo "npm run dev"