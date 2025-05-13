#!/usr/bin/env tsx

import 'dotenv/config';

import { generateSignedToken } from '@/scripts/partner/utils/signToken';
import { normalizePartner } from '@/scripts/partner/utils/normalize';
import { getEnv } from '@/lib/utils/readEnv';
import partnerTiers from '@/config/partnerTiers.json';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import clipboard from 'clipboardy';

// Base URL for partner access
const baseURL = 'https://www.axpt.io/partner/whitepaper';

// Get CLI argument
const rawName = process.argv.slice(2).join(' ').trim();

if (!rawName) {
  console.error(chalk.red('\n❌ Please provide a partner name.\nExample:\n  npx tsx bin/token-invite.ts "Errol Charles"\n'));
  process.exit(1);
}

// Normalize partner key
const partner = normalizePartner(rawName) as keyof typeof partnerTiers;
const tierInfo = partnerTiers[partner] as {
  tier: string;
  displayName?: string;
  greeting?: string;
  docs?: string[];
};

if (!tierInfo) {
  console.warn(chalk.yellow(`\n⚠️ No tier found for ${partner}. Defaulting to 'Partner'.\n`));
}

const tier = tierInfo?.tier || 'Partner';
const docs = tierInfo?.docs || [];

// Generate token
const PARTNER_SECRET = getEnv('PARTNER_SECRET');
const tokenResult = generateSignedToken(partner, PARTNER_SECRET, tier, docs);
const token = tokenResult.token;
const encodedURL = `${baseURL}?token=${encodeURIComponent(token)}`;

// Format message
const message = `
━━━━━━━━━━━━━━━━━━━━━━
🔐 AXPT Partner Portal Access
━━━━━━━━━━━━━━━━━━━━━━

🎟️  Partner: ${rawName}
🔗  Secure URL:
${encodedURL}

📜 To enter:
1. Click the link
2. Confirm terms
3. Press "Enter the Portal"

🧾 Token (auto-filled in link):
${token}

━━━━━━━━━━━━━━━━━━━━━━
Tier: ${tier}
Docs: ${docs.join(', ') || 'None'}
━━━━━━━━━━━━━━━━━━━━━━
`;

const logsDir = join(process.cwd(), 'logs');
mkdirSync(logsDir, { recursive: true });

const filePath = join(logsDir, `invite-${partner}.txt`);
writeFileSync(filePath, message);
clipboard.writeSync(message);

console.log(chalk.green(`\n✅ Invite generated for ${chalk.bold(rawName)}\n`));
console.log(chalk.gray(`📁 Saved to logs: ${filePath}`));
console.log(chalk.blue(`📋 Copied to clipboard.`));
console.log(chalk.white(message));