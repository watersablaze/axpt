// File: app/scripts/partner/token.ts

import 'dotenv/config';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import { normalizePartner } from './utils/normalize';
import { generateSignedToken } from './utils/signToken';
import { getEnv } from './utils/readEnv';
import rawPartnerTiers from '@/config/partnerTiers.json';
import tierDocs from '@/config/tierDocs.json';

const partners = rawPartnerTiers as Record<string, string>;
const tierToDocs = tierDocs as Record<string, string[]>;
const LOG_FILE = path.resolve(process.cwd(), 'logs/token-actions.log');
const QR_DIR = path.resolve(process.cwd(), 'qrcodes');

const logAction = (entry: string) => {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, line);
};

async function generateTokenFlow() {
  const secret = getEnv('PARTNER_SECRET');

  const { name: rawName } = await prompts({
    type: 'text',
    name: 'name',
    message: 'Enter Partner Name (raw, e.g. Jane Doey):'
  });

  const normalized = normalizePartner(rawName);
  const tier = partners[normalized] || 'unclassified';
  const allowedDocs = tierToDocs[tier] || [];

  console.log(`\n📛 Partner Name Submitted: ${rawName}`);
  console.log(`🔧 Normalized to:          ${normalized}`);
  console.log(`🎖️ Tier Detected:           ${tier}`);
  console.log(`📄 Docs:                   ${allowedDocs.join(', ') || 'None'}`);

  const { token, payload, encoded, signature } = generateSignedToken(
    rawName,
    secret,
    tier,
    allowedDocs,
    true
  );

  const link = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(token)}`;
  const qrPath = path.resolve(QR_DIR, `${normalized}.png`);
  await qrcode.toFile(qrPath, link);

  console.log(`\n🔐 Token Generated\n──────────────────────────────`);
  console.log(`Raw Partner : ${rawName}`);
  console.log(`Normalized  : ${normalized}`);
  console.log(`Tier        : ${tier}`);
  console.log(`PDFs        : ${allowedDocs.join(', ') || 'None'}`);
  console.log(`Token       : ${token}`);
  console.log(`Encoded     : ${encoded}`);
  console.log(`Signature   : ${signature}`);
  console.log(`Link        : ${link}`);
  console.log(`QR Code     : ${qrPath}`);
  console.log(`──────────────────────────────\n`);

  logAction(`Generated token for '${rawName}' [${normalized}] → Tier: ${tier}`);
}

generateTokenFlow();