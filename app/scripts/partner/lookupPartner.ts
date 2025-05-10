import 'dotenv/config';
// File: app/scripts/partner/lookupPartner.ts
import fs from 'fs';
import path from 'path';

const query = process.argv[2];
if (!query) {
  console.error('❌ Provide a partner name to lookup');
  process.exit(1);
}

const logPath = path.join(process.cwd(), 'logs/partner-token-directory.json');
if (!fs.existsSync(logPath)) {
  console.error('📭 Log file not found.');
  process.exit(1);
}

const log = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
const matches = log.filter((entry: any) =>
  entry.raw.toLowerCase().includes(query.toLowerCase()) ||
  entry.normalized.toLowerCase().includes(query.toLowerCase())
);

if (matches.length) {
  console.log(`🔎 Found ${matches.length} matching entr${matches.length === 1 ? 'y' : 'ies'}:\n`);
  matches.forEach((entry: any, i: number) => {
    console.log(`${i + 1}. ${entry.raw} (${entry.normalized})`);
    console.log(`   🔗 Token: ${entry.token}`);
    console.log(`   🕰️  Created: ${entry.timestamp}\n`);
  });
} else {
  console.log('❌ No matches found.');
}