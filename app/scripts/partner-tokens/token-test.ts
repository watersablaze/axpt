// ✅ NEW: app/scripts/partner-tokens/token-test.ts

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { generateSignedToken } from '@/utils/token';
import { TokenPayload } from '@/types/token';
import qrcode from 'qrcode';

const payload: TokenPayload = {
  partner: 'test-partner',
  tier: 'Investor',
  docs: ['AXPT-Whitepaper.pdf', 'Hemp.pdf'],
  iat: Math.floor(Date.now() / 1000),
};

const token = generateSignedToken(payload);
const qrDir = path.resolve(process.cwd(), 'public/qr');
const qrPath = path.join(qrDir, `${payload.partner}.png`);
const qrUrl = `https://www.axpt.io/qr-view?token=${token}`;

(async () => {
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });
  await qrcode.toFile(qrPath, qrUrl);
  console.log(chalk.green('✅ Test token created'));
  console.log(chalk.cyan(`Token:`), token);
  console.log(chalk.blue('QR saved at:'), qrPath);
})();