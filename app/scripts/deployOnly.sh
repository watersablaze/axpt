#!/bin/bash

# === AXPT | Minimal Deploy Ritual ===
# Usage: chmod +x app/scripts/deployOnly.sh && app/scripts/deployOnly.sh

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/deployOnly_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🚦 AXPT | Quick Deploy Initiated"
echo -e "\nChoose deployment method:\n  1) Vercel CLI\n  2) Git Push\n"
read -p "→ Enter 1 or 2: " method

if [ "$method" == "1" ]; then
  vercel --prod --confirm >> "$logfile" 2>&1
  if [ $? -eq 0 ]; then
    log "✅ Deployed with Vercel CLI."
  else
    log "❌ Vercel CLI deploy failed."
    exit 1
  fi
elif [ "$method" == "2" ]; then
  git add . >> "$logfile" 2>&1
  git commit -m "📦 Quick deploy at $timestamp" >> "$logfile" 2>&1
  git push origin master >> "$logfile" 2>&1
  if [ $? -eq 0 ]; then
    log "✅ Changes pushed to Git for deployment."
  else
    log "❌ Git push failed."
    exit 1
  fi
else
  log "❌ Invalid input. Aborting deploy."
  exit 1
fi

log "\n📜 Log saved to $logfile"