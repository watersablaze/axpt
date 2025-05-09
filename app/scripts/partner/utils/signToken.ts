// File: app/scripts/partner/utils/signToken.ts
import crypto from 'node:crypto';
import { normalizePartner } from './normalize';
import fs from 'fs';
import path from 'path';

export const generateSignedToken = (
  partner: string,
  secret: string,
  log = true
): { raw: string; normalized: string; token: string } => {
  const normalized = normalizePartner(partner);
  const hmac = crypto.createHmac('sha256', secret).update(normalized).digest('hex');
  const token = `${normalized}:${hmac}`;

  if (log) {
    const logPath = path.join(process.cwd(), 'logs/partner-token-directory.json');
    const entry = {
      raw: partner,
      normalized,
      token,
      timestamp: new Date().toISOString(),
    };

    const existing = fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
      : [];

    existing.push(entry);
    fs.writeFileSync(logPath, JSON.stringify(existing, null, 2));
  }

  return { raw: partner, normalized, token };
};