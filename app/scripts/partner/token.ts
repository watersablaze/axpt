import { CANONICAL_DOMAIN, LOCAL_DEV_DOMAIN } from "@/lib/constants";
// File: app/scripts/partner/token.ts

import 'dotenv/config';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import os from 'os';
import { exec } from 'child_process';
import clipboardy from 'clipboardy';
import crypto from 'crypto';

import { normalizePartner } from './utils/normalize';
import { generateSignedToken } from './utils/signToken';
import { getEnv } from '@/lib/utils/readEnv';
import rawPartnerTiers from '@/config/partnerTiers.json';
import tierDocs from '@/config/tierDocs.json';

const partners = rawPartnerTiers as Record<string, {
  tier: string;
  displayName: string;
  greeting: string;
}>;
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
  const partnerEntry = partners[normalized];
  const tier = partnerEntry?.tier || 'unclassified';
  const allowedDocs = tierToDocs[tier] || [];

  console.log(`\n📛 Partner Name Submitted: ${rawName}`);
  console.log(`🔧 Normalized to:          ${normalized}`);
  console.log(`🎖️ Tier Detected:          ${tier}`);
  console.log(`📄 Docs:                   ${allowedDocs.join(', ') || 'None'}`);

  const { token, encoded, signature } = generateSignedToken(
    rawName,
    secret,
    tier,
    allowedDocs,
    true
  );

  const link = `${CANONICAL_DOMAIN}/partner/whitepaper?token=${encodeURIComponent(token)}`;
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

  await clipboardy.write(token);
  console.log(`📋 Token copied to clipboard.`);

  if (!process.argv.includes('--no-preview')) {
    const openCmd =
      os.platform() === 'darwin'
        ? `open "${qrPath}"`
        : os.platform() === 'win32'
        ? `start "" "${qrPath}"`
        : `xdg-open "${qrPath}"`;

    exec(openCmd, (err) => {
      if (err) {
        console.error('⚠️ Could not open QR preview:', err.message);
      } else {
        console.log('🖼️  QR code preview launched.');
      }
    });
  }

  // 🧪 Inline Local Verification Using PARTNER_SECRET
  console.log(`\n🧪 Verifying token using local PARTNER_SECRET...`);
  try {
    const [payloadPart, sigPart] = token.split(':');
    const parsed = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(parsed))
      .digest('hex');

    if (expectedSig === sigPart) {
      console.log(`✅ Live Verification Passed`);
      console.log(`🎖️ Tier: ${parsed.tier}`);
      const access = Array.isArray(parsed.allowedDocs) ? parsed.allowedDocs.join(', ') : 'None';
      console.log(`📄 Access: ${access}`);
    } else {
      console.error(`❌ Invalid token signature.`);
    }
  } catch (err: any) {
    console.error(`❌ Failed to verify token: ${err.message}`);
  }
}

generateTokenFlow();