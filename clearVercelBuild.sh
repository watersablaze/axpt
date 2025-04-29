#!/bin/bash

# === AXPT Admin Arsenal ===
# Script: clearVercelBuild.sh
# Purpose: Soft clear local Vercel + build artifacts

echo "\n🧹 Deleting .next/ and .vercel/ cache folders (local only)..."

rm -rf .next .vercel

echo "\n✅ Local build artifacts cleared."
echo "You can now run: npm run build or npm run dev\n"