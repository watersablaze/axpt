#!/bin/bash

echo "🔍 Running NextAuth Sanity Check..."

# 1. Check if env variable is present
echo "🌿 Checking .env.local for NEXT_PUBLIC_ENABLE_NEXTAUTH..."
grep 'NEXT_PUBLIC_ENABLE_NEXTAUTH' .env.local || echo "❌ NEXT_PUBLIC_ENABLE_NEXTAUTH not set in .env.local"

# 2. Check all files for useSession / getSession (only matters if NextAuth is disabled)
echo "🔎 Scanning for useSession/getSession usage..."
grep -rnw './' -e 'useSession' --exclude-dir=node_modules
grep -rnw './' -e 'getSession' --exclude-dir=node_modules

# 3. Check if SessionProviderWrapper.tsx uses require correctly
echo "🧪 Verifying SessionProviderWrapper import strategy..."
grep -rn 'require.*next-auth' ./components/SessionProviderWrapper.tsx || echo "⚠️ No require('next-auth') found."

# 4. Check for accidental static imports (which break conditional logic)
echo "🧯 Checking for static imports of SessionProvider..."
grep -rn "from 'next-auth/react'" ./components/SessionProviderWrapper.tsx && echo "❌ Static import of next-auth/react found! Must be dynamic via require()."

echo "✅ NextAuth Sanity Check complete."