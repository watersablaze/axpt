#!/bin/bash
# ────────────────────────────────────────────────
#  AXPT.io Silent Deployment Script ⚡
#  Build → Commit → Push → Auto Notify
# ────────────────────────────────────────────────

# CONFIGURATION
PROJECT_NAME="AXPT.io"
VERCEL_URL="https://vercel.com/<your-team-or-username>/axpt.io/deployments"
NOTIFY_EMAIL="connect@axpt.io"        # 📨 Resend notification recipient
DISCORD_WEBHOOK_URL=""                # 💬 Optional — add your webhook here
RESEND_API_KEY="$RESEND_API_KEY"      # pulled from your .env (exported)

echo ""
echo "─────────────────────────────────────────────"
echo " ⚡ ${PROJECT_NAME} Silent Deployment Sequence"
echo "─────────────────────────────────────────────"
echo ""

# 1️⃣ Build Project
echo "🏗️  Building optimized production bundle..."
pnpm build --silent
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Aborting."
  exit 1
fi

# 2️⃣ Commit + Push
echo "🪶 Committing and pushing changes..."
git add -A
commit_message="Deploy: $(date '+%Y-%m-%d %H:%M:%S') — silent build"
git commit -m "$commit_message" --quiet
git push origin master --quiet

if [ $? -eq 0 ]; then
  echo "✅ Code pushed successfully to master."
else
  echo "❌ Push failed. Please check remote."
  exit 1
fi

# 3️⃣ Open Vercel Dashboard (background)
open "$VERCEL_URL" >/dev/null 2>&1 &

# 4️⃣ Auto Notify via Resend (optional)
if [ ! -z "$RESEND_API_KEY" ]; then
  echo "📨 Sending deployment email notification via Resend..."
  curl -s -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"from\": \"noreply@axpt.io\",
      \"to\": [\"$NOTIFY_EMAIL\"],
      \"subject\": \"🚀 ${PROJECT_NAME} Deployed Successfully\",
      \"html\": \"<p><b>${PROJECT_NAME}</b> was deployed at $(date '+%Y-%m-%d %H:%M:%S').<br>
      View on <a href='${VERCEL_URL}'>Vercel Dashboard</a>.</p>\"
    }" >/dev/null 2>&1
  echo "✅ Resend notification sent to $NOTIFY_EMAIL"
else
  echo "⚠️  Skipping Resend email (no API key found)."
fi

# 5️⃣ Auto Notify via Discord Webhook (optional)
if [ ! -z "$DISCORD_WEBHOOK_URL" ]; then
  echo "💬 Sending Discord webhook notification..."
  curl -s -H "Content-Type: application/json" \
    -d "{
      \"username\": \"AXPT Deployment Bot\",
      \"avatar_url\": \"https://axpt.io/favicon.ico\",
      \"embeds\": [{
        \"title\": \"${PROJECT_NAME} Deployed Successfully\",
        \"description\": \"Live on [Vercel](${VERCEL_URL})\",
        \"color\": 5814783,
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }]
    }" "$DISCORD_WEBHOOK_URL" >/dev/null 2>&1
  echo "✅ Discord notification sent."
else
  echo "⚠️  Skipping Discord webhook (no URL set)."
fi

echo ""
echo "✨ Silent deployment complete — build now live on Vercel."
echo "─────────────────────────────────────────────"
echo " Asé — Broadcast successful across the Axis."
echo "─────────────────────────────────────────────"