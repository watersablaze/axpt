#!/bin/bash
# ────────────────────────────────────────────────────────────────
#  AXPT.io Deployment Ritual Script 🪶
#  Automates: type check → build → commit → push → open Vercel
#  Works with Neon + Prisma + Next.js 15 + pnpm
# ────────────────────────────────────────────────────────────────

# 🕯️ Setup
echo ""
echo "─────────────────────────────────────────────"
echo " 🪶 AXPT.io Deployment Ritual Initiated"
echo "─────────────────────────────────────────────"
echo ""

# 1️⃣ TypeScript Sanity Check
echo "⚙️  Running TypeScript check..."
pnpm tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors detected. Aborting deployment."
  exit 1
fi
echo "✅ TypeScript clean."
echo ""

# 2️⃣ Prisma Client Sync
echo "📜 Generating Prisma client..."
pnpm prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Prisma generation failed. Aborting."
  exit 1
fi
echo "✅ Prisma client ready."
echo ""

# 3️⃣ Neon Database Sync Check
echo "🔍 Checking Neon database connection..."
pnpm prisma migrate status | grep "Database schema is up to date"
if [ $? -ne 0 ]; then
  echo "⚠️  Warning: Prisma migration may be out of sync."
  echo "Proceeding, but you should review schema consistency."
else
  echo "✅ Neon database schema is in sync."
fi
echo ""

# 4️⃣ Next.js Build
echo "🏗️  Building Next.js project..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deployment."
  exit 1
fi
echo "✅ Build successful."
echo ""

# 5️⃣ Git Commit + Push
echo "🪄 Preparing git commit..."
git add .
commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S') — production build"
git commit -m "$commit_message"

echo "🚀 Pushing to origin/master..."
git push origin master
if [ $? -ne 0 ]; then
  echo "❌ Git push failed. Check remote or credentials."
  exit 1
fi
echo "✅ Code pushed to master."
echo ""

# 6️⃣ Open Vercel Dashboard
echo "🌐 Opening Vercel dashboard..."
sleep 2
open "https://vercel.com/dashboard?utm_source=axpt-cli"

echo ""
echo "✨ Deployment ritual complete. Monitor build logs in Vercel."
echo "─────────────────────────────────────────────"
echo " Asé — May the Axis stay in motion."
echo "─────────────────────────────────────────────"