// app/scripts/moveAllLottiesToSrc.ts

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { argv } from 'process';

// ✅ Workaround for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const dryRun = argv.includes('--dry');
const safeMode = argv.includes('--safe');

// Source and target directories
const fromDir = path.resolve(__dirname, '../../public/lotties');
const toDir = path.resolve(__dirname, '../../src/lotties');

// Ensure target directory exists
if (!fs.existsSync(toDir)) {
  if (!dryRun) {
    fs.mkdirSync(toDir, { recursive: true });
  }
  console.log('📁 Created directory: src/lotties/');
}

// Read source directory
const files = fs.readdirSync(fromDir).filter((f) => f.endsWith('.json'));

if (files.length === 0) {
  console.log('⚠️ No Lottie .json files found in public/lotties/');
  process.exit(0);
}

for (const file of files) {
  const fromPath = path.join(fromDir, file);
  const toPath = path.join(toDir, file);

  if (safeMode && fs.existsSync(toPath)) {
    console.log(`⏩ Skipping ${file} (already exists in src/lotties)`);
    continue;
  }

  if (dryRun) {
    console.log(`💡 DRY RUN: Would move ${file} → src/lotties/`);
  } else {
    fs.copyFileSync(fromPath, toPath);
    fs.unlinkSync(fromPath);
    console.log(`✅ Moved ${file} → src/lotties/`);
  }
}