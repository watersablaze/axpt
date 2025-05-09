// npx tsx app/scripts/partner/verifyToken.ts "normalized:signature"
// ✅ AXPT Token Verifier with Log Lookup + HMAC Validation

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const token = process.argv[2];

if (!token || !token.includes(':')) {
  console.error("❌ Please provide a token in the format 'partner:signature'.\nExample: npx tsx app/scripts/partner/verifyToken.ts 'rain-capital:abc123'");
  process.exit(1);
}

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error("❌ Missing PARTNER_SECRET in .env");
  process.exit(1);
}

const [normalizedName, providedSignature] = token.split(':');

// 🔍 Load log
const logPath = path.join(process.cwd(), './logs/partner-token-directory.json');
if (!fs.existsSync(logPath)) {
  console.error("❌ Log file not found. Cannot verify against directory.");
  process.exit(1);
}

let logs;
try {
  logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
} catch {
  console.error("❌ Failed to parse log file.");
  process.exit(1);
}

const entry = logs.find((e: any) => e.normalizedName === normalizedName);
if (!entry) {
  console.error(`❌ No matching entry found for: "${normalizedName}"`);
  process.exit(1);
}

// 🔐 Recreate payload & verify signature
const reconstructedPayload = {
  partner: entry.normalizedName,
  tier: entry.tier,
  allowedDocs: entry.allowedDocs,
  iat: new Date(entry.generatedAt).getTime(),
};

const expectedSignature = crypto
  .createHmac('sha256', PARTNER_SECRET)
  .update(JSON.stringify(reconstructedPayload))
  .digest('hex');

if (expectedSignature === providedSignature) {
  console.log(`✅ Valid token for "${entry.originalName}"`);
  console.log(`🎖️ Tier: ${entry.tier}`);
  console.log(`📄 Access: ${entry.allowedDocs.join(', ')}`);
  console.log(`📅 Issued at: ${entry.generatedAt}`);
} else {
  console.error('❌ Invalid token signature.');
}