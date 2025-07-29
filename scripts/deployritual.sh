#!/bin/bash

echo ""
echo "⟁ AXPT | MetaDeploy Ritual"
echo "🌐 Location: $(pwd)"
echo "──────────────────────────────────────"

# 1. Verify Configuration
echo "⚡ Running verify-config..."
chmod +x app/scripts/verify-config.sh
sh app/scripts/verify-config.sh
if [ $? -ne 0 ]; then
  echo "❌ Configuration verification failed. Aborting deploy."
  exit 1
fi

# 2. Verify .env NODE_ENV is set correctly
ENV_VAL=$(grep "^NODE_ENV=" .env | cut -d '=' -f2)
if [[ "$ENV_VAL" == "production" ]]; then
  echo "✅ .env NODE_ENV is set to production"
else
  echo "⚠️  NODE_ENV in .env is '$ENV_VAL' — should be 'production' for deploy"
fi

# 3. Run TypeScript Checks
echo ""
echo "📘 Running TypeScript validation..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed. Aborting deploy."
  exit 1
fi

# 4. Run Build
echo ""
echo "🏗️  Building production version..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting deploy."
  exit 1
fi

# 5. Commit and Push to Git
echo ""
echo "📦 Committing to Git..."
git add .
git commit -m "🔁 AXPT Deploy Commit: $(date +'%Y-%m-%d %H:%M:%S')"
git push

# 6. Deploy to Vercel
echo ""
echo "🚀 Triggering Vercel Deploy..."
vercel --prod

echo ""
echo "🎉 AXPT Deployed Successfully to Production"
echo "=============================================="