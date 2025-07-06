#!/bin/bash

echo "⟁ AXPT | Local Deploy Ritual"
echo "──────────────────────────────────────────"

# 1. Run Preflight Checks
echo "🌀 Running Ultra Preflight Deploy..."
bash bin/ultraPreflightDeploy.sh

if [ $? -ne 0 ]; then
  echo "❌ Preflight checks failed. Aborting local deploy."
  exit 1
fi

# 2. Doctor Checkup
echo "🩺 Running AXPT Doctor Checkup..."
DOCTOR_SCRIPT=$(find app/scripts -name 'doctor.ts*' | head -n 1)
pnpm exec tsx "$DOCTOR_SCRIPT"

if [ $? -ne 0 ]; then
  echo "❌ Doctor checkup failed. Fix issues before continuing."
  exit 1
fi

# 3. Optional Local Build Preview (skippable via flag)
read -p "👁️  Run local Next.js preview server after build? (y/n): " PREVIEW_CHOICE
if [[ "$PREVIEW_CHOICE" == "y" ]]; then
  echo "🔍 Launching local preview server at http://localhost:3000 ..."
  pnpm dev
else
  echo "🚫 Skipping preview server. Build artifacts available in `.next`."
fi

echo "✅ AXPT | Local Deploy Ritual complete"
echo "🕓 Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "──────────────────────────────────────────"