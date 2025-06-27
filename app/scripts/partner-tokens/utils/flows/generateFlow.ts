// ✅ PATCHED: app/scripts/partner-tokens/utils/flows/generateFlow.ts

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import qrcode from 'qrcode';
import readline from 'readline';
import { generateSignedToken } from '@/utils/token';
import { TokenPayload } from '@/types/token';

const logPath = path.resolve(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');
const qrDir = path.resolve(process.cwd(), 'public/qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q: string): Promise<string> => new Promise(res => rl.question(chalk.cyan(`${q}: `), res));

// ✅ FINAL: generateFlow.ts
export async function generateFlow(): Promise<{ token: string; payload: TokenPayload; qrPath: string }> {
  console.log(chalk.magentaBright(`\nAXPT.io Token Generator`));
  console.log(chalk.gray(`----------------------------`));

  const partner = await ask('Enter partner name (e.g., maya)');
  const tier = await ask('Enter tier (Investor, Board, Partner, Farmer, Merchant, Nomad)');
  const docsRaw = await ask('Comma-separated docs (e.g. AXPT-Whitepaper.pdf,Hemp.pdf)');
  const docs = docsRaw.split(',').map(d => d.trim());

  const payload: TokenPayload = {
    partner,
    tier: tier as TokenPayload['tier'],
    docs,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = generateSignedToken(payload);
  const qrPath = path.join(qrDir, `${partner}.png`);
  const qrUrl = `https://www.axpt.io/qr-view?token=${token}`;
  await qrcode.toFile(qrPath, qrUrl);

  const entry = { ...payload, token };
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf-8')) : [];
  log.unshift(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  console.log(chalk.green('✓ Token created for'), partner);
  console.log(chalk.blue('QR saved at:'), qrPath);

  rl.close();
  return { token, payload, qrPath };
}