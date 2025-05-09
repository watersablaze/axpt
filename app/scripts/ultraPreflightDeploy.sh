#!/bin/bash

# === AXPT | Ultra Preflight + Deploy Ritual ===
# Usage: chmod +x app/scripts/ultraPreflightDeploy.sh && app/scripts/ultraPreflightDeploy.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/ultraPreflightDeploy_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🧱 [PRE] Validating canonical directory structure..."
./app/scripts/validate-canonical-structure.sh >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Canonical structure validation failed."
  exit 1
fi

log "🔐 [PRE] Scanning for missing 'use client' on useSession()..."
./app/scripts/check-useSession-client-boundary.sh >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ 'useSession()' used without 'use client'. Fix this before continuing."
  exit 1
fi

log "🧹 [0/7] Cleaning .next and .turbo caches..."
rm -rf .next .turbo >> "$logfile" 2>&1
log "✅ Cache directories removed.\n"

log "📁 [1/7] Validating alias paths..."
./app/scripts/validate-aliases-from-tsconfig.sh >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Alias validation failed. Check tsconfig.json."
  exit 1
fi
log "✅ Alias validation passed.\n"

log "🧠 [2/7] Type-checking..."
npx tsc --noEmit >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ TypeScript errors detected. Fix before continuing."
  exit 1
fi
log "✅ Type check passed.\n"

log "🧬 [3/7] Running Prisma generate..."
npx prisma generate >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Prisma generate failed. Check schema.prisma."
  exit 1
fi
log "✅ Prisma client generated.\n"

log "🧪 [4/7] Running Next.js production build..."
npm run build >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Build failed. Investigate above errors."
  exit 1
fi
log "✅ Build successful.\n"

log "🔎 [5/7] Checking for stale dashboard imports..."
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

log "📦 [6/7] Scanning for Prisma and Stripe usage..."
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

log "\n🚦 [7/7] Confirm Deploy"
read -p "🚀 Ready to deploy? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  log "🛑 Launch aborted by operator."
  exit 0
fi

log "🛠️ Executing Deploy Ritual..."
./deployritual >> "$logfile" 2>&1
if [ $? -eq 0 ]; then
  log "✅ Deploy Ritual completed successfully."
else
  log "❌ Deploy Ritual failed. Check logs for details."
fi

log "\n📜 Log saved to $logfile"