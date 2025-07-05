#!/bin/bash
echo "🔐 Resetting Node & PNPM lock state..."

rm -rf node_modules pnpm-lock.yaml
pnpm install

echo "✅ Clean install complete."
