#!/bin/bash

# === AXPT | Ultra Preflight + Deploy Ritual ===
# Usage: chmod +x bin/preflight && bin/preflight

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/ultraPreflightDeploy_$timestamp.log"
mkdir -p logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🧱 [PRE] Validating canonical directory structure..."
"$SCRIPT_DIR/../app/scripts/validate-canonical-structure.sh" >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Canonical structure validation failed."
  exit 1
fi

log "🔐 [PRE] Scanning for missing 'use client' on useSession()..."
"$SCRIPT_DIR/../app/scripts/check-useSession-client-boundary.sh" >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ 'useSession()' used without 'use client'. Fix this before continuing."
  exit 1
fi

log "🧹 [0/7] Cleaning .next and .turbo caches..."
rm -rf .next .turbo >> "$logfile" 2>&1
log "✅ Cache directories removed.\n"

log "📁 [1/7] Validating alias paths..."
"$SCRIPT_DIR/../app/scripts/validate-aliases-from-tsconfig.sh" >> "$logfile" 2>&1
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

log "🔎 [5/7] Auditing for stale dashboard remnants..."
"$SCRIPT_DIR/../app/scripts/audit-dashboard-remnants.sh" >> "$logfile" 2>&1
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

log "📦 [6/7] Noting Prisma and Stripe usage (non-destructive)..."
prismaFiles=$(grep -rl "@prisma/client" app/src lib || true)
stripeFiles=$(grep -rl "stripe" app/src lib || true)

if [[ -n "$prismaFiles" ]]; then
  log "⚠️ Prisma usage detected:"
  echo "$prismaFiles" | tee -a "$logfile"
else
  log "✅ No Prisma usage detected."
fi

if [[ -n "$stripeFiles" ]]; then
  log "⚠️ Stripe usage detected:"
  echo "$stripeFiles" | tee -a "$logfile"
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
echo -e "\nChoose deployment method:\n  1) Vercel CLI\n  2) Git Push\n"
read -p "→ Enter 1 or 2: " method

if [ "$method" == "1" ]; then
  vercel --prod --yes >> "$logfile" 2>&1
  if [ $? -eq 0 ]; then
    log "✅ Deployed with Vercel CLI."
  else
    log "❌ Vercel CLI deploy failed."
    exit 1
  fi

elif [ "$method" == "2" ]; then
  git add . >> "$logfile" 2>&1
  git commit -m "📦 Auto deploy at $timestamp" >> "$logfile" 2>&1
  git push origin master >> "$logfile" 2>&1
  if [ $? -eq 0 ]; then
    log "✅ Changes pushed to Git for deployment."

    echo -e "\n🚀 Would you like to now deploy to Vercel CLI?"
    read -p "→ Enter y or n: " vercelConfirm
    if [ "$vercelConfirm" == "y" ]; then
      vercel --prod --yes >> "$logfile" 2>&1
      if [ $? -eq 0 ]; then
        log "✅ Deployed with Vercel CLI after Git push."
      else
        log "❌ Vercel CLI deploy failed after Git push."
        exit 1
      fi
    else
      log "🕊️ Skipping Vercel CLI deploy after Git push."
    fi
  else
    log "❌ Git push failed."
    exit 1
  fi
else
  log "❌ Invalid input. Aborting deploy."
  exit 1
fi

log "\n📜 Log saved to $logfile"
