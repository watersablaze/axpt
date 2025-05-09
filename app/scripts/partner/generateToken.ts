// npx tsx app/scripts/partner/generateToken.ts
// ✅ AXPT Partner Token Generator (HMAC-SHA256)
// Ensures normalized partner name is signed (e.g., lowercased-dashed)

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import prompts from 'prompts';

const normalizePartner = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error('❌ Missing PARTNER_SECRET in .env');
  process.exit(1);
}

const generateToken = (rawPartner: string): { token: string; normalized: string } => {
  const normalized = normalizePartner(rawPartner);
  const hmac = crypto.createHmac('sha256', PARTNER_SECRET);
  hmac.update(normalized);
  const signature = hmac.digest('hex');
  return { token: `${normalized}:${signature}`, normalized };
};

const main = async () => {
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: '✔ Enter Partner Name:',
  });

  if (!name) {
    console.error('❌ No name entered. Aborting.');
    return;
  }

  const { token, normalized } = generateToken(name);
  const url = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(token)}`;
  const qrOutputPath = path.join(process.cwd(), `./qrcodes/${normalized}.png`);

  fs.mkdirSync(path.dirname(qrOutputPath), { recursive: true });
  await qrcode.toFile(qrOutputPath, url);

  const logPath = path.join(process.cwd(), './logs/partner-token-directory.json');
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  let existing = [];
  if (fs.existsSync(logPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
    } catch {
      console.warn('⚠️ Could not parse log file, starting fresh.');
    }
  }

  const entry = {
    originalName: name,
    normalizedName: normalized,
    token,
    url,
    qrPath: qrOutputPath,
    generatedAt: new Date().toISOString(),
  };

  existing.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));

  console.log(`\n✅ Token generated for: ${name}`);
  console.log(`🔗 Link: ${url}`);
  console.log(`🔒 Token: ${token}`);
  console.log(`📎 QR Code saved: ${qrOutputPath}`);
  console.log(`📘 Log updated: ${logPath}\n`);
};

main();
