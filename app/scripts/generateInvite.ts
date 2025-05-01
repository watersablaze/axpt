// app/scripts/generateInvite.ts
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';

const rawInput = process.argv[2];

if (!rawInput) {
  console.error("❌ Please provide a partner name.\nExample: npx tsx app/scripts/generateInvite.ts 'The Kingdom Collective'");
  process.exit(1);
}

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error("❌ Missing PARTNER_SECRET in .env");
  process.exit(1);
}

// 🔠 Normalize for token + hash use
const normalizePartner = (name: string) => name.trim().replace(/\s+/g, '-');

const generateToken = (partner: string): string => {
  const normalized = normalizePartner(partner);
  const hmac = crypto.createHmac('sha256', PARTNER_SECRET);
  hmac.update(normalized);
  const digest = hmac.digest('hex');
  return `${normalized}:${digest}`;
};

const main = async () => {
  const token = generateToken(rawInput);
  const url = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(token)}`;
  const fileName = normalizePartner(rawInput);

  const qrOutputPath = path.join(process.cwd(), `./qrcodes/${fileName}.png`);
  fs.mkdirSync(path.dirname(qrOutputPath), { recursive: true });
  await qrcode.toFile(qrOutputPath, url);

  console.log(`\n✅ New AXPT.io Partner Token Generated\n`);
  console.log(`🎟️ Partner: ${rawInput}`);
  console.log(`🔐 Token:\n${token}\n`);
  console.log(`🔗 Access Portal URL:\n${url}\n`);
  console.log(`📎 QR Code saved at:\n${qrOutputPath}\n`);
};

main();