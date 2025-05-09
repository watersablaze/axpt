// File: app/scripts/partner/token.ts

import 'dotenv/config';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import { normalizePartner } from './utils/normalize';
import { generateSignedToken } from './utils/signToken';
import { getEnv } from './utils/readEnv';
import tiers from '@/config/tiers.json' assert { type: 'json' };

const LOG_FILE = path.resolve(process.cwd(), 'logs/token-actions.log');

const logAction = (entry: string) => {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, line);
};

const verifyToken = (token: string): boolean => {
  const [raw, sig] = token.split(':');
  const secret = getEnv('PARTNER_SECRET');
  const norm = normalizePartner(raw);
  const expected = generateSignedToken(norm, secret).token.split(':')[1];
  return sig === expected;
};

async function generateTokenFlow() {
  const secret = getEnv('PARTNER_SECRET');
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'Enter Partner Name:',
  });

  const result = generateSignedToken(name, secret);
  const link = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(result.token)}`;
  const qrPath = path.resolve(`qrcodes/${result.normalized}.png`);
  await qrcode.toFile(qrPath, link);

  const tier = (tiers as Record<string, string>)[result.normalized] || 'unclassified';

  const output = `\n🔐 Token Generated\n──────────────────────────────\nRaw Partner: ${result.raw}\nNormalized: ${result.normalized}\nToken     : ${result.token}\nLink      : ${link}\nTier      : ${tier}\nQR Path   : ${qrPath}\n──────────────────────────────\n`;

  console.log(output);
  logAction(`Generated token for '${result.raw}' [${result.normalized}] → Tier: ${tier}`);
}

async function verifyTokenFlow() {
  const { token } = await prompts({
    type: 'text',
    name: 'token',
    message: 'Enter full token to verify:'
  });

  const isValid = verifyToken(token);
  const [raw] = token.split(':');
  const norm = normalizePartner(raw);
  const tier = (tiers as Record<string, string>)[norm] || 'unclassified';

  const output = `\n🔎 Verification\n──────────────────────────────\nToken: ${token}\nPartner: ${norm}\nTier: ${tier}\nValid: ${isValid ? '✅ YES' : '❌ NO'}\n──────────────────────────────\n`;

  console.log(output);
  logAction(`Verified token for '${norm}' → Result: ${isValid ? 'VALID' : 'INVALID'}`);
}

async function lookupPartnerFlow() {
  const { partner } = await prompts({
    type: 'text',
    name: 'partner',
    message: 'Enter normalized partner name to lookup:'
  });

  const tier = (tiers as Record<string, string>)[partner] || 'unclassified';
  const output = `\n📇 Partner Lookup\n──────────────────────────────\nPartner: ${partner}\nTier   : ${tier}\n──────────────────────────────\n`;

  console.log(output);
  logAction(`Looked up partner '${partner}' → Tier: ${tier}`);
}

function listAllPartners() {
  console.log('\n📋 Registered Partners + Tiers');
  console.log('──────────────────────────────');
  Object.entries(tiers).forEach(([name, tier]) => {
    console.log(`${name} → ${tier}`);
  });
  console.log('──────────────────────────────\n');
  logAction('Listed all registered partners.');
}

async function main() {
  console.clear();
  console.log('🧿 AXPT Token CLI Dashboard');
  console.log('──────────────────────────────\n');

  const menu = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: '🔐 Generate New Token', value: 'generate' },
      { title: '🔎 Verify Existing Token', value: 'verify' },
      { title: '📇 Lookup Partner Info', value: 'lookup' },
      { title: '📋 List All Partners', value: 'list' },
      { title: '🚪 Exit', value: 'exit' },
    ],
  });

  switch (menu.action) {
    case 'generate': return await generateTokenFlow();
    case 'verify': return await verifyTokenFlow();
    case 'lookup': return await lookupPartnerFlow();
    case 'list': return listAllPartners();
    case 'exit':
    default:
      console.log('\n👋 Goodbye.');
      process.exit(0);
  }
}

main();
