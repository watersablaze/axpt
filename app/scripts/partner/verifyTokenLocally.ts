// app/scripts/partner/verifyTokenLocally.ts

import 'dotenv/config';
import crypto from 'node:crypto';
import { normalizePartner } from './utils/normalize';
import { getEnv } from './utils/readEnv';

const PARTNER_SECRET = getEnv('PARTNER_SECRET');

const inputToken = process.argv[2];

if (!inputToken) {
  console.error('❌ Please provide a token.\nUsage: npx tsx app/scripts/partner/verifyTokenLocally.ts <token>');
  process.exit(1);
}

const [rawPartner, providedSignature] = inputToken.split(':');

if (!rawPartner || !providedSignature) {
  console.error('❌ Malformed token. Use format: <partner>:<signature>');
  process.exit(1);
}

const normalized = normalizePartner(rawPartner);
const expectedSignature = crypto.createHmac('sha256', PARTNER_SECRET).update(normalized).digest('hex');

const isMatch = expectedSignature === providedSignature;

console.log(`\n🔍 Verifying Token:\n`);
console.log(`Raw Partner:         ${rawPartner}`);
console.log(`Normalized Partner:  ${normalized}`);
console.log(`Provided Signature:  ${providedSignature}`);
console.log(`Expected Signature:  ${expectedSignature}`);

if (isMatch) {
  console.log(`\n✅ Token is VALID.`);
} else {
  console.log(`\n❌ Token is INVALID.`);
}