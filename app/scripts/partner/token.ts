// File: app/scripts/partner/token.ts

import 'dotenv/config';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import { normalizePartner } from './utils/normalize';
import { generateSignedToken } from './utils/signToken';
import { getEnv } from './utils/readEnv';
import rawPartnerTiers from '@/config/partnerTiers.json' assert { type: 'json' };
import rawTierDocs from '@/config/tierDocs.json' assert { type: 'json' };

const partners = rawPartnerTiers as Record<string, string>;
const tierToDocs = rawTierDocs as Record<string, string[]>;
const PARTNER_FILE = path.resolve('app/config/partnerTiers.json');
const TIERS_FILE = path.resolve('app/config/tierDocs.json');
const LOG_FILE = path.resolve(process.cwd(), 'logs/token-actions.log');
const QR_DIR = path.resolve(process.cwd(), 'qrcodes');

const logAction = (entry: string) => {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, line);
};

const verifyToken = (token: string): boolean => {
  const [raw, sig] = token.split(':');
  const secret = getEnv('PARTNER_SECRET');
  const norm = normalizePartner(raw);
  const expected = generateSignedToken(norm, secret).token.split(':')[1];
  return sig === expected;
};

async function generateTokenFlow() {
  const secret = getEnv('PARTNER_SECRET');
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'Enter Partner Name:',
  });

  const result = generateSignedToken(name, secret);
  const link = `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(result.token)}`;
  const qrPath = path.resolve(QR_DIR, `${result.normalized}.png`);
  await qrcode.toFile(qrPath, link);

  const tier = partners[result.normalized] || 'unclassified';
  const allowedDocs = tierToDocs[tier] || [];

  console.log(`\n🔐 Token Generated\n──────────────────────────────\nRaw Partner: ${result.raw}\nNormalized: ${result.normalized}\nToken     : ${result.token}\nLink      : ${link}\nTier      : ${tier}\nPDFs      : ${allowedDocs.join(', ')}\nQR Path   : ${qrPath}\n──────────────────────────────\n`);

  logAction(`Generated token for '${result.raw}' [${result.normalized}] → Tier: ${tier}`);
}

// Remaining logic remains unchanged; continue using `partners` and `tierToDocs` throughout...
// You can request I re-patch additional flows like edit/lookup/etc. with this dual-tier model.
