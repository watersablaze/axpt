#!/bin/bash

# === AXPT: Prisma Restore & Build Ritual ===
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/restore_prisma_$timestamp.log"
mkdir -p logs

echo "🔁 Restoring lib/prisma.ts..." | tee -a "$logfile"

cat <<EOF > lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
EOF

echo "✅ lib/prisma.ts restored." | tee -a "$logfile"

echo "🔍 Verifying prisma/schema.prisma..." | tee -a "$logfile"

if grep -q "model User" prisma/schema.prisma && ! grep -q "//.*model User" prisma/schema.prisma; then
  echo "✅ schema.prisma appears to be active." | tee -a "$logfile"
else
  echo "❌ schema.prisma may still be commented or corrupted." | tee -a "$logfile"
  exit 1
fi

echo "⚙️ Running: prisma generate..." | tee -a "$logfile"
pnpm prisma generate >> "$logfile" 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Prisma generate failed. Check logs." | tee -a "$logfile"
  exit 1
else
  echo "✅ Prisma client generated." | tee -a "$logfile"
fi

echo "🏗️ Running: pnpm build..." | tee -a "$logfile"
pnpm build >> "$logfile" 2>&1

if [ $? -eq 0 ]; then
  echo "🎉 Build succeeded." | tee -a "$logfile"
else
  echo "❌ Build failed. Check logs at $logfile" | tee -a "$logfile"
  exit 1
fi