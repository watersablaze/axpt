#!/bin/bash

# === AXPT | Post-Cleanup Bundle Check ===
# Timestamped log
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
logfile="logs/post_cleanup_bundle_$timestamp.log"
mkdir -p logs

log() {
  echo -e "$1" | tee -a "$logfile"
}

log "🧼 [1/4] Checking for stale import paths..."
grep -r "import .* from '.*\.\.\/" app/src || log "✅ No relative import issues detected."

log "🔎 [2/4] Checking for unresolved module errors with tsc..."
npx tsc --noEmit >> "$logfile" 2>&1

if [ $? -ne 0 ]; then
  log "❌ Unresolved modules or TypeScript errors found."
else
  log "✅ No TypeScript errors found."
fi

log "📁 [3/4] Verifying tsconfig.json path aliases..."
node <<'EOF' >> "$logfile"
const fs = require('fs');
const path = require('path');

const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
const paths = tsconfig.compilerOptions.paths;
const baseUrl = tsconfig.compilerOptions.baseUrl || '.';

console.log("🔍 Validating paths from tsconfig.json...");
for (const alias in paths) {
  const target = paths[alias][0].replace(/\*$/, '');
  const resolved = path.resolve(baseUrl, target);
  if (fs.existsSync(resolved)) {
    console.log(`✅ ${alias} → ${target} exists`);
  } else {
    console.log(`❌ ${alias} → ${target} is missing`);
  }
}
EOF

log "🧪 [4/4] Attempting clean Next.js build to confirm..."
pnpm build >> "$logfile" 2>&1

if [ $? -eq 0 ]; then
  log "✅ Build successful. System appears clean."
else
  log "❌ Build failed. See log: $logfile"
fi