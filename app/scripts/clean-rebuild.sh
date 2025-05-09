#!/bin/bash

# === AXPT | Clean Rebuild Script ===
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/clean_rebuild_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🧹 [1/4] Cleaning .next and .turbo caches..."
rm -rf .next .turbo
log "✅ Cache directories removed.\n"

log "🔍 [2/4] Checking schema.prisma..."
if grep -q "model User" prisma/schema.prisma; then
  log "✅ schema.prisma appears active."
else
  log "⚠️ schema.prisma may be inactive or commented. Please verify."
fi

log "⚙️ [3/4] Running Prisma generate..."
npx prisma generate >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Prisma generation failed. Check your schema.prisma file."
  exit 1
fi
log "✅ Prisma client generated.\n"

log "🏗️ [4/4] Running production build..."
pnpm build >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Build failed. Check logs at $logfile"
  exit 1
fi

log "✅ Clean rebuild completed successfully."