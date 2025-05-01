#!/bin/bash

echo "🔍 AXPT Localhost Debug Utility"

echo -e "\n1. Checking if port 3000 is in use..."
lsof -i :3000

echo -e "\n2. Checking if Next.js dev server is running..."
ps aux | grep 'next dev' | grep -v grep

echo -e "\n3. Verifying .env variables..."
if [ -f ".env.local" ]; then
  echo "✅ .env.local file found."
else
  echo "⚠️  .env.local file NOT found."
fi

echo -e "\n4. Checking node_modules presence..."
if [ -d "node_modules" ]; then
  echo "✅ node_modules directory exists."
else
  echo "⚠️  node_modules directory is missing. Run 'npm install'"
fi

echo -e "\n5. Checking Next.js app structure..."
if [ -d "app" ]; then
  echo "✅ /app directory found"
else
  echo "❌ /app directory is missing!"
fi

echo -e "\n6. Attempting to start local server..."
npm run dev
