#!/bin/bash

# === AXPT | Ultra Preflight + Deploy Ritual ===
# Timestamp: Auto-log enabled
# Usage: chmod +x ultraPreflightDeploy.sh && ./ultraPreflightDeploy.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/ultraPreflightDeploy_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🔍 [1/6] Running TypeScript checks..."
npx tsc --noEmit >> "$logfile" 2>&1

if [ $? -ne 0 ]; then
  log "❌ TypeScript errors detected. Fix before continuing."
  exit 1
fi

log "✅ Type check passed.\n"

log "🧪 [2/6] Running local Next.js production build..."
npm run build >> "$logfile" 2>&1

if [ $? -ne 0 ]; then
  log "❌ Build failed. Investigate above errors."
  exit 1
fi

log "✅ Build successful.\n"

log "🔎 [3A/6] Checking for stale dashboard imports..."
./app/scripts/verify-no-stale-dashboard-imports.sh >> "$logfile" 2>&1

if [ $? -ne 0 ]; then
  log "⚠️  Stale dashboard imports detected. Review output above."
  read -p "🛑 Continue anyway? (y/n): " dashConfirm
  if [ "$dashConfirm" != "y" ]; then
    log "🛑 Deployment aborted due to stale imports."
    exit 1
  fi
else
  log "✅ No stale dashboard imports found.\n"
fi

# === PRISMA + STRIPE AUTO-DETECTION ===
log "🔍 [4/6] Scanning for Prisma and Stripe usage..."

prismaFiles=$(grep -rl "@prisma/client" app lib || true)
stripeFiles=$(grep -rl "stripe" app lib || true)

if [[ -n "$prismaFiles" ]]; then
  log "⚠️ Prisma usage detected:"
  echo "$prismaFiles" | tee -a "$logfile"
  for file in $prismaFiles; do
    if [[ "$file" != *.temp.ts ]]; then
      mv "$file" "${file/.ts/.temp.ts}"
      log "  🔒 Renamed $file → ${file/.ts/.temp.ts}" 
    fi
  done
else
  log "✅ No Prisma usage detected."
fi

if [[ -n "$stripeFiles" ]]; then
  log "⚠️ Stripe usage detected:"
  echo "$stripeFiles" | tee -a "$logfile"
  for file in $stripeFiles; do
    if [[ "$file" != *.temp.ts ]]; then
      mv "$file" "${file/.ts/.temp.ts}"
      log "  🔒 Renamed $file → ${file/.ts/.temp.ts}" 
    fi
  done
else
  log "✅ No Stripe usage detected."
fi

log "\n🚦 [5/6] Confirm Deploy"
read -p "🚀 Ready to deploy? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  log "🛑 Launch aborted by operator."
  exit 0
fi

log "🛠️ [6/6] Executing Deploy Ritual..."
./deployritual >> "$logfile" 2>&1

if [ $? -eq 0 ]; then
  log "✅ Deploy Ritual completed successfully."
else
  log "❌ Deploy Ritual failed. Check the logs for more details."
fi

log "\n📜 Log saved to $logfile"