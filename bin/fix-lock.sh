#!/bin/bash

# === AXPT | Fix Lockfile Checksum Errors ===
# Usage: chmod +x bin/fix-lock.sh && bin/fix-lock.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/fix-lock_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🔄 AXPT | Lockfile Reset & Reinstall Script"
log "📦 Step 1: Removing node_modules, pnpm-lock.yaml, .pnpm-store..."
rm -rf node_modules pnpm-lock.yaml .pnpm-store >> "$logfile" 2>&1

log "📦 Step 2: Reinstalling with --no-frozen-lockfile..."
pnpm install --no-frozen-lockfile >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ pnpm install failed. Check logs for errors."
  exit 1
fi
log "✅ Dependencies installed successfully.\n"

log "📝 Step 3: Committing regenerated lockfile..."
git add pnpm-lock.yaml >> "$logfile" 2>&1
git commit -m "🔧 Fix lockfile checksum and reinstall modules [auto]" >> "$logfile" 2>&1

log "✅ Lockfile reset and committed.\n📜 Log saved to $logfile"