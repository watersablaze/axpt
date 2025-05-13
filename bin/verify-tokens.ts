#!/usr/bin/env tsx

import 'dotenv/config';
import crypto from 'crypto';
import open from 'open';
import fs from 'fs';
import path from 'path';

const token = process.argv[2];
const PARTNER_SECRET = process.env.PARTNER_SECRET;
const BASE_URL = process.env.CANONICAL_DOMAIN || 'https://www.axpt.io';

if (!token || !PARTNER_SECRET) {
  console.error(`\n❌ Usage: npx tsx bin/verify-token.ts <TOKEN>\n`);
  if (!PARTNER_SECRET) console.error('❌ Missing PARTNER_SECRET in .env');
  process.exit(1);
}

const [encoded, providedSig] = token.split(':');
if (!encoded || !providedSig) {
  console.error('❌ Malformed token. Must contain base64:signature');
  process.exit(1);
}

let raw = '';
try {
  raw = Buffer.from(encoded, 'base64').toString('utf8');
} catch (e) {
  console.error('❌ Failed to decode token payload:', e);
  process.exit(1);
}

let payload: any;
try {
  payload = JSON.parse(raw);
} catch (e) {
  console.error('❌ Failed to parse JSON payload:', e);
  process.exit(1);
}

const expectedSig = crypto.createHmac('sha256', PARTNER_SECRET).update(raw).digest('hex');
const isValid = expectedSig === providedSig;

console.log(`\n🔍 Token Debug:`);
console.log(`  Partner: ${payload.partner}`);
console.log(`  Tier: ${payload.tier}`);
console.log(`  Docs: ${payload.docs?.join(', ')}`);
console.log(`  Issued At: ${new Date(payload.iat * 1000).toISOString()}`);
console.log(`\n🔐 Signature Match: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

if (!isValid) {
  console.log(`  Expected Sig: ${expectedSig}`);
  console.log(`  Provided Sig: ${providedSig}`);
  process.exit(1);
}

console.log('\n✅ Token is valid and verified.');

const fullURL = `${BASE_URL}/partner/whitepaper?token=${encodeURIComponent(token)}`;
console.log(`\n🌐 Opening invite link: ${fullURL}`);
await open(fullURL);

const logPath = path.join(process.cwd(), './logs/verified-tokens.log');
const logEntry = `[${new Date().toISOString()}] ✅ ${payload.partner} → ${fullURL}\n`;
fs.mkdirSync(path.dirname(logPath), { recursive: true });
fs.appendFileSync(logPath, logEntry);
