// File: app/scripts/partner/generateToken.ts
// ✅ AXPT Partner Token Generator with Tier + PDF Access Injection

import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import prompts from 'prompts';
import partnerTiers from '@/config/partnerTiers.json' assert { type: 'json' };
import tierDocs from '@/config/tierDocs.json' assert { type: 'json' };

const partners = partnerTiers as Record<string, string>;
const tierToDocs = tierDocs as Record<string, string[]>;

const normalizePartner = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

const PARTNER_SECRET = process.env.PARTNER_SECRET;
if (!PARTNER_SECRET) {
  console.error('❌ Missing PARTNER_SECRET in .env');
  process.exit(1);
}

const generateSignedToken = (payload: object): string => {
  const hmac = crypto.createHmac('sha256', PARTNER_SECRET);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
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

  const { tier } = await prompts({
    type: 'select',
    name: 'tier',
    message: '📊 Select Tier:',
    choices: Object.keys(tierToDocs).map(t => ({ title: t, value: t })),
  });

  if (!tier || !tierToDocs[tier]) {
    console.error('❌ Invalid or no tier selected.');
    return;
  }

  const normalized = normalizePartner(name);
  const allowedDocs = tierToDocs[tier] || [];
  const payload = { partner: normalized, tier, allowedDocs, iat: Date.now() };
  const signature = generateSignedToken(payload);
  const token = `${normalized}:${signature}`;
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
    tier,
    token,
    allowedDocs,
    url,
    qrPath: qrOutputPath,
    generatedAt: new Date().toISOString(),
  };

  existing.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));

  console.log(`\n✅ Token generated for: ${name}`);
  console.log(`🎖️ Tier: ${tier}`);
  console.log(`📄 PDFs: ${allowedDocs.join(', ')}`);
  console.log(`🔗 Link: ${url}`);
  console.log(`🔒 Token: ${token}`);
  console.log(`📎 QR Code saved: ${qrOutputPath}`);
  console.log(`📘 Log updated: ${logPath}\n`);
};

main();
