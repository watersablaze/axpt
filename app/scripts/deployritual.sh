#!/bin/bash

echo "⟁ AXPT | MetaDeploy Ritual"
echo "🌐 Location: $(pwd)"
echo "------------------------------------"

# Log everything to preflight.log
LOGFILE="preflight.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "🩺 Running AXPT Doctor Checkup..."

# Ensure Prisma Client is generated before anything
echo "🔁 Ensuring Prisma Client is generated..."
pnpm prisma generate --silent

# Locate and run doctor script
DOCTOR_SCRIPT=$(find app/scripts -name 'doctor.ts*' | head -n 1)
pnpm exec tsx "$DOCTOR_SCRIPT" --silent
if [ $? -ne 0 ]; then
  echo "❌ Doctor checkup failed. Deployment halted."
  exit 1
fi

echo "✅ Doctor checkup passed. Proceeding to deployment..."
echo "------------------------------------"
echo "🛠️  Running ultraPreflightDeploy Ritual..."

bash app/scripts/ultraPreflightDeploy.sh || {
  echo "❌ Build failed. Aborting."
  exit 1
}

echo "📡 Verifying token flow with test call..."
TEST_TOKEN="TEST_TOKEN"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST http://localhost:3000/api/partner/verify-token \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TEST_TOKEN\"}")

echo "📝 Token Endpoint Response: $RESPONSE" >> "$LOGFILE"

if [ "$RESPONSE" = "200" ]; then
  echo "✅ Token endpoint returned 200 OK."
elif [ "$RESPONSE" = "400" ]; then
  echo "⚠️  Token endpoint returned 400 — likely expected for a dummy token. API reachable."
else
  echo "❌ Token endpoint returned unexpected status: $RESPONSE"
fi

echo "🌱 Running Vercel .env sync test..."
pnpm exec vercel env pull .env.production --yes

echo "✅ AXPT | MetaDeploy Ritual Complete"
echo "🕓 Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "🚀 Project successfully built and ready for launch."