// scripts/export-abi.mjs
// Copies ABI(s) from Foundry /out into /src/lib/chain/abis/*
// Usage: `node scripts/export-abi.mjs`

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// Map of contract → { out json, dest abi path }
const targets = [
  {
    name: 'ProtiumToken',
    outJson: path.join(root, 'out', 'ProtiumToken.sol', 'ProtiumToken.json'),
    destAbi: path.join(root, 'src', 'lib', 'chain', 'abis', 'protiumToken.json'),
  },
  // Add more here later (e.g., HydrogenAuction) as you create them.
];

let wrote = 0;
for (const t of targets) {
  if (!fs.existsSync(t.outJson)) {
    console.error(`[abi] Skipping ${t.name}: ${t.outJson} not found. Did you run \`forge build\`?`);
    continue;
  }

  const json = JSON.parse(fs.readFileSync(t.outJson, 'utf8'));
  const abi = json.abi || json.metadata?.output?.abi;
  if (!abi) {
    console.error(`[abi] No ABI found in ${t.outJson}`);
    continue;
  }

  fs.mkdirSync(path.dirname(t.destAbi), { recursive: true });
  fs.writeFileSync(t.destAbi, JSON.stringify(abi, null, 2) + '\n', 'utf8');
  console.log(`[abi] Wrote ${t.destAbi}`);
  wrote++;
}

if (!wrote) {
  process.exitCode = 1;
}