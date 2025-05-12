// File: app/scripts/partner/verifyToken.ts

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { normalizePartner } from './utils/normalize';
import { getEnv } from '@/lib/utils/readEnv';

// Get token from CLI args
const token = process.argv[2];

if (!token || !token.includes(':')) {
  console.error("❌ Please provide a token in the format '<partner>:<signature>'\nExample: npx tsx app/scripts/partner/verifyToken.ts 'ron-borges:abc123'");
  process.exit(1);
}

const PARTNER_SECRET = getEnv('PARTNER_SECRET');
const [rawPartner, providedSignature] = token.split(':');
const normalized = normalizePartner(rawPartner);

// Optional: Load partner-token-directory.json if it exists
const logPath = path.resolve(process.cwd(), 'logs/partner-token-directory.json');
let entry = null;

if (fs.existsSync(logPath)) {
  try {
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    entry = logs.find((e: any) => e.normalizedName === normalized);
  } catch {
    console.error("❌ Failed to parse partner-token-directory.json");
    process.exit(1);
  }
}

// Build expected signature from either log data or normalized partner
let expectedSignature: string;

if (entry) {
  const reconstructedPayload = {
    partner: normalized,
    tier: entry.tier,
    allowedDocs: entry.allowedDocs,
    iat: new Date(entry.generatedAt).getTime(),
  };
  expectedSignature = crypto.createHmac('sha256', PARTNER_SECRET).update(JSON.stringify(reconstructedPayload)).digest('hex');
} else {
  // fallback: legacy/dev tokens
  expectedSignature = crypto.createHmac('sha256', PARTNER_SECRET).update(normalized).digest('hex');
}

// Output
console.log(`\n🧪 Verifying Token:`);
console.log(`Raw Partner:         ${rawPartner}`);
console.log(`Normalized Partner:  ${normalized}`);
console.log(`Provided Signature:  ${providedSignature}`);
console.log(`Expected Signature:  ${expectedSignature}`);

if (expectedSignature === providedSignature) {
  console.log(`\n✅ Token is VALID.`);
  if (entry) {
    console.log(`👤 Partner: ${entry.originalName}`);
    console.log(`🎖️ Tier: ${entry.tier}`);
    console.log(`📄 Docs: ${entry.allowedDocs.join(', ')}`);
    console.log(`📅 Issued: ${entry.generatedAt}`);
  } else {
    console.log(`⚠️ No token metadata found in logs — verified using fallback mode.`);
  }
} else {
  console.error(`\n❌ Token is INVALID.`);
}
