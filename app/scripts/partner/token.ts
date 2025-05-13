// File: app/scripts/partner/token.ts

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import crypto from 'crypto';
import qrcode from 'qrcode';
import clipboardy from 'clipboardy';
import os from 'os';
import { exec } from 'child_process';

import { normalizePartner } from './utils/normalize';
import { getEnv } from '@/lib/utils/readEnv';
import rawPartnerTiers from '@/config/partnerTiers.json';
import tierDocs from '@/config/tierDocs.json';

const CANONICAL_DOMAIN = 'https://www.axpt.io';
const partners = rawPartnerTiers as Record<string, { tier: string; displayName: string; greeting: string }>;
const tierToDocs = tierDocs as Record<string, string[]>;
const LOG_FILE = path.resolve(process.cwd(), 'logs/token-actions.log');
const QR_DIR = path.resolve(process.cwd(), 'qrcodes');
const JSON_LOG_FILE = path.resolve(process.cwd(), 'logs/partner-token-directory.json');

function logAction(entry: string) {
  const line = `[${new Date().toISOString()}] ${entry}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

function writeTokenToDirectory(entry: any) {
  let directory: any[] = [];
  if (fs.existsSync(JSON_LOG_FILE)) {
    try {
      directory = JSON.parse(fs.readFileSync(JSON_LOG_FILE, 'utf-8'));
    } catch {
      console.warn('⚠️ Could not parse partner-token-directory.json. Resetting.');
    }
  }
  directory.push(entry);
  fs.writeFileSync(JSON_LOG_FILE, JSON.stringify(directory, null, 2));
  console.log(`📘 Logged partner to: ${JSON_LOG_FILE}`);
}

function generateSignedToken(partner: string, secret: string, tier: string, docs: string[], log = false) {
  const payload = {
    partner,
    tier,
    docs,
    iat: Date.now(),
  };

  const raw = JSON.stringify(payload);
  const encoded = Buffer.from(raw).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const token = `${encoded}:${signature}`;

  if (log) logAction(`Generated token for ${partner}`);

  return { token, encoded, signature, payload };
}

function decodeAndVerifyToken(token: string, secret: string) {
  const [encoded, sig] = token.split(':');
  if (!encoded || !sig) return { valid: false, reason: 'Malformed token.' };

  try {
    const raw = Buffer.from(encoded, 'base64').toString('utf8');
    const payload = JSON.parse(raw);
    const expectedSig = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    const valid = expectedSig === sig;

    return { valid, reason: valid ? 'Valid ✅' : 'Signature mismatch ❌', payload, expectedSig };
  } catch (err: any) {
    return { valid: false, reason: 'Failed to parse token payload.', error: err };
  }
}

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

  const { token, encoded, signature, payload } = generateSignedToken(
    normalized,
    secret,
    tier,
    allowedDocs,
    true
  );

  const link = `${CANONICAL_DOMAIN}/partner/whitepaper?token=${encodeURIComponent(token)}`;
  const qrPath = path.resolve(QR_DIR, `${normalized}.png`);
  await qrcode.toFile(qrPath, link);

  console.log(`\n🔐 Token Generated for ${rawName}`);
  console.log(`──────────────────────────────`);
  console.log(`Token: ${token}`);
  console.log(`Link:  ${link}`);
  console.log(`PDFs:  ${allowedDocs.join(', ') || 'None'}`);

  await clipboardy.write(token);
  console.log(`📋 Token copied to clipboard.`);

  writeTokenToDirectory({
    originalName: rawName,
    normalized,
    displayName: partnerEntry?.displayName || normalized,
    greeting: partnerEntry?.greeting || '',
    tier,
    allowedDocs,
    token,
    generatedAt: new Date().toISOString(),
  });

  if (!process.argv.includes('--no-preview')) {
    const openCmd = os.platform() === 'darwin'
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
}

function verifyTokenCLI(rawToken: string) {
  const secret = getEnv('PARTNER_SECRET');
  const result = decodeAndVerifyToken(rawToken, secret);

  console.log('\n🔍 Token Verification');
  console.log('──────────────────────────────');
  console.log('Status:', result.reason);
  if (result.valid) {
    console.log('Payload:', result.payload);
    console.log('Expected Signature:', result.expectedSig);
  }
}

async function main() {
  const subcommand = process.argv[2];

  switch (subcommand) {
    case 'generate':
      await generateTokenFlow();
      break;
    case 'verify': {
      const token = process.argv[3];
      if (!token) {
        console.error('❌ Provide a token to verify: bin/token verify "<token>"');
        process.exit(1);
      }
      verifyTokenCLI(token);
      break;
    }
    default:
      console.log('\n🔐 AXPT Token CLI');
      console.log('──────────────────────────────');
      console.log('Commands:');
      console.log('  generate           Create a new partner token');
      console.log('  verify <token>     Decode and verify a token');
      break;
  }
}

main();
