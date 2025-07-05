// FILE: cli/generateTokenForCLI.ts

import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import clipboard from 'clipboardy';
import chalk from 'chalk';
import { generateSignedToken } from '../app/src/utils/token';
import { getEnv } from '@/scripts/partner-tokens/utils/readEnv';
import { TokenPayload } from '@/types/token';

console.log('[🔐 SECRET CHECK]', getEnv('PARTNER_SECRET'));

export interface TokenEntry {
  partner: string;
  tier: string;
  docs: string[];
  token: string;
  qrPath: string;
  createdAt: string;
}

const qrDir = path.resolve(process.cwd(), 'public/qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

export async function generateTokenForCLI(
  partner: string,
  tier: string,
  docs: string[]
): Promise<TokenEntry> {
  const payload: TokenPayload = {
    partner,
    tier: tier as TokenPayload['tier'],
    docs,
    iat: Math.floor(Date.now() / 1000),
  };

const token = await generateSignedToken(payload);

  const qrPath = path.join(qrDir, `${partner}.png`);
  const qrURL = `https://www.axpt.io/qr-view?token=${token}`;

  await qrcode.toFile(qrPath, qrURL, {
    margin: 1,
    width: 400,
    color: { dark: '#000000', light: '#FFFFFF' },
  });

if (typeof token === 'string') clipboard.writeSync(token);
else console.warn('⚠️ Token is not a string. Clipboard copy skipped.');

  console.log(chalk.green(`\n✓ Token generated for:`), chalk.cyan(partner));
  console.log(chalk.magenta(`📄 QR saved to:`), chalk.gray(qrPath));
  console.log(chalk.yellow(`🔗 Token:`), chalk.white(token));
  console.log(chalk.gray(`📋 Token copied to clipboard.`));

  return {
    partner,
    tier,
    docs,
    token,
    qrPath,
    createdAt: new Date().toISOString(),
  };
}