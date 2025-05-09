#!/bin/bash

ENV_FILE=".env.local"
ENV_VAR="NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT"

echo "🔁 CLIENT LAYOUT TOGGLE"
echo "--------------------------"
echo "1. Disable dynamic ClientLayoutWrapper"
echo "2. Enable dynamic ClientLayoutWrapper"
echo "3. Exit"
echo "--------------------------"
read -p "Choose an option (1/2/3): " choice

if [ "$choice" == "1" ]; then
  sed -i '' 's/^NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT=.*/NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT=false/' "$ENV_FILE"
  echo "❌ ClientLayoutWrapper dynamic logic disabled in .env.local"
elif [ "$choice" == "2" ]; then
  sed -i '' 's/^NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT=.*/NEXT_PUBLIC_ENABLE_CLIENT_LAYOUT=true/' "$ENV_FILE"
  echo "✅ ClientLayoutWrapper dynamic logic enabled in .env.local"
else
  echo "⏹️ Cancelled."
  exit 0
fi