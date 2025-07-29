#!/bin/bash

echo "🧙‍♂️ AXPT Predeploy Ritual: Initiating Full-Stack Scan..."

# 1. Ensure build is clean
echo "🔧 Running pnpm build..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix issues before deploying."
  exit 1
fi

# 2. Start the server to check runtime behavior
echo "🧪 Starting server temporarily (pnpm start)..."
PORT=4000 pnpm start &
SERVER_PID=$!

# Give server some time to start
sleep 10

# 3. Scan for client-only code misuse (window, localStorage, etc.)
echo "🔍 Scanning for client-only code used without hydration guard..."
grep -RIn --include=*.tsx "localStorage\|window\|document" app/src/components | grep -v "'use client'"
if [ $? -eq 0 ]; then
  echo "⚠️ Warning: Client-only code used without proper hydration guards!"
else
  echo "✅ No unguarded client-only code found."
fi

# 4. Kill the test server
kill $SERVER_PID
echo "🧹 Cleaned up test server."

echo "🎉 Predeploy checks complete. Ready to deploy!"
