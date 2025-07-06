#!/bin/bash
echo "🧙 AXPT Lite Restoration Begins..."
echo "================================="

# Full removal
rm -rf node_modules pnpm-lock.yaml .turbo .npmrc
pnpm store prune

# Safe registry + no retries
echo "registry=https://registry.npmjs.org/" > .npmrc
echo "fetch-retries=1" >> .npmrc
echo "fetch-retry-mintimeout=1000" >> .npmrc

# Minimal trusted add
pnpm add -D --ignore-scripts typescript @types/node @types/react @types/react-dom

# Base libraries only, no native modules
pnpm add --ignore-scripts next react react-dom

# Type check
pnpm exec tsc --noEmit

echo "✅ AXPT Lite Restore Complete"