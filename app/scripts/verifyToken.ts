// app/scripts/verifyToken.ts
import 'dotenv/config';
import crypto from 'crypto';

const token = process.argv[2];

if (!token) {
  console.error("❌ Please provide a token to verify.\nExample: npx tsx app/scripts/verifyToken.ts 'Partner:hash'");
  process.exit(1);
}

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error("❌ Missing PARTNER_SECRET in .env");
  process.exit(1);
}

const [partnerString, providedSignature] = token.split(':');

if (!partnerString || !providedSignature) {
  console.error("❌ Malformed token.");
  process.exit(1);
}

const expectedSignature = crypto
  .createHmac('sha256', PARTNER_SECRET)
  .update(partnerString)
  .digest('hex');

if (expectedSignature === providedSignature) {
  console.log(`✅ Token is valid for partner: ${partnerString}`);
} else {
  console.log(`❌ Token is invalid.`);
}