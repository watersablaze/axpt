// app/scripts/generateInvite.ts
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';

const partnerName = process.argv[2];

if (!partnerName) {
  console.error("❌ Please provide a partner name.\nExample: npx tsx app/scripts/generateInvite.ts 'The Kingdom Collective'");
  process.exit(1);
}

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error("❌ Missing PARTNER_SECRET in .env");
  process.exit(1);
}

const generateToken = (partner: string): string => {
  const hmac = crypto.createHmac('sha256', PARTNER_SECRET);
  hmac.update(partner);
  const digest = hmac.digest('hex');
  return `${partner.replace(/\s+/g, '-')}:${digest}`;
};

const main = async () => {
  const token = generateToken(partnerName);
  const safePartnerName = partnerName.replace(/\s+/g, '-');
  const url = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(token)}`;
  const qrOutputPath = path.join(process.cwd(), `./qrcodes/${safePartnerName}.png`);

  fs.mkdirSync(path.dirname(qrOutputPath), { recursive: true });
  await qrcode.toFile(qrOutputPath, url);

  const logPath = path.join(process.cwd(), './logs/partner-token-directory.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  let existing = [];
  if (fs.existsSync(logPath)) {
    const raw = fs.readFileSync(logPath, 'utf-8');
    try {
      existing = JSON.parse(raw);
    } catch {
      console.warn('⚠️ Could not parse existing log file, starting fresh.');
    }
  }

  const newEntry = {
    partner: partnerName,
    token,
    url,
    qrPath: qrOutputPath,
    generatedAt: new Date().toISOString(),
  };

  existing.push(newEntry);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));

  console.log(`\n✅ New AXPT.io Partner Token Generated\n`);
  console.log(`🎟️ Partner: ${partnerName}`);
  console.log(`🔐 Token:\n${token}\n`);
  console.log(`🔗 Access Portal URL:\n${url}\n`);
  console.log(`📎 QR Code saved at:\n${qrOutputPath}`);
  console.log(`📘 Directory updated at:\n${logPath}\n`);
};

main();