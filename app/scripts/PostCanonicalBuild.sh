#!/bin/bash

# === AXPT | Post Canonical Structure Build ===
# Usage: chmod +x postCanonicalBuild.sh && ./postCanonicalBuild.sh

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOGFILE="logs/postCanonicalBuild_$TIMESTAMP.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$LOGFILE"
}

log "\n📁 [1/4] Verifying canonical structure..."
if ./app/scripts/validate-canonical-structure.sh >> "$LOGFILE" 2>&1; then
  log "✅ Canonical structure intact."
else
  log "❌ Structural integrity issues found. See details above."
  exit 1
fi

log "\n🧠 [2/4] Running TypeScript type-check..."
npx tsc --noEmit >> "$LOGFILE" 2>&1
if [ $? -ne 0 ]; then
  log "❌ TypeScript errors detected. Fix before proceeding."
  exit 1
else
  log "✅ Type-check passed."
fi

log "\n🛠️ [3/4] Building production bundle..."
NODE_ENV=production pnpm build >> "$LOGFILE" 2>&1
if [ $? -ne 0 ]; then
  log "❌ Build failed. Review log at $LOGFILE."
  exit 1
else
  log "✅ Build completed successfully."
fi

log "\n📜 [4/4] Log saved to $LOGFILE"
exit 0
