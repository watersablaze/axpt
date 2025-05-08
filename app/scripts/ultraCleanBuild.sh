#!/bin/bash

# === AXPT | Ultra Clean Build ===
# Timestamped build process
# Usage: chmod +x ultraCleanBuild.sh && ./ultraCleanBuild.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/ultraCleanBuild_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🧹 [1/5] Cleaning .next and .turbo caches..."
rm -rf .next .turbo >> "$logfile" 2>&1
log "✅ Cache directories removed.\n"

log "📁 [2/5] Validating alias paths..."
if ./app/scripts/validate-aliases-from-tsconfig.sh >> "$logfile" 2>&1; then
  log "✅ Alias validation passed.\n"
else
  log "❌ Alias validation failed. Check paths or tsconfig.json."
  exit 1
fi

log "🧠 [3/5] Type-checking..."
npx tsc --noEmit >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ TypeScript errors detected. Fix before continuing."
  exit 1
fi
log "✅ Type check passed.\n"

log "🧬 [4/5] Running Prisma generate..."
npx prisma generate >> "$logfile" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Prisma generate failed. Check schema.prisma."
  exit 1
fi
log "✅ Prisma client generated.\n"

log "🏗️ [5/5] Running Next.js production build..."
npm run build >> "$logfile" 2>&1
if [ $? -eq 0 ]; then
  log "✅ Build successful."
else
  log "❌ Build failed. Check the logs at $logfile"
  exit 1
fi