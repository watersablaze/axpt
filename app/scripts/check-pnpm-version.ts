#!/usr/bin/env tsx

const expected = '10.12.4';
const actual = require('child_process')
  .execSync('pnpm -v')
  .toString()
  .trim();

if (actual !== expected) {
  console.error(`❌ PNPM version mismatch! Expected ${expected}, but found ${actual}`);
  process.exit(1);
} else {
  console.log(`✅ PNPM version ${actual} is correct.`);
}
