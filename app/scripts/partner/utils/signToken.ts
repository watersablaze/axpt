// File: app/scripts/partner/utils/signToken.ts
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { normalizePartner } from './normalize';
import { getEnv } from '@/lib/utils/readEnv';

export const generateSignedToken = (
  partner: string,
  secret: string,
  tier: string = 'unclassified',
  docs: string[] = [],
  log: boolean = true
): {
  raw: string;
  normalized: string;
  token: string;
  payload: Record<string, any>;
  encoded: string;
  signature: string;
} => {
  const normalized = normalizePartner(partner);
  const payload = {
    partner: normalized,
    tier,
    docs,
    iat: Date.now(),
  };

  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(json).digest('hex');
  const token = `${encoded}:${signature}`;

  if (log) {
    const logPath = path.join(process.cwd(), 'logs/partner-token-directory.json');
    const entry = {
      originalName: partner,
      normalizedName: normalized,
      tier,
      allowedDocs: docs,
      token,
      url: `https://axpt.io/partner/whitepaper?token=${encodeURIComponent(token)}`,
      qrPath: path.join('qrcodes', `${normalized}.png`),
      generatedAt: new Date().toISOString(),
    };

    const existing = fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
      : [];

    existing.push(entry);
    fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
  }

  return {
    raw: partner,
    normalized,
    token,
    payload,
    encoded,
    signature,
  };
};