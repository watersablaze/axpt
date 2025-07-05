// ✅ FILE: app/scripts/partner-tokens/utils/flows/generateFlow.ts

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import qrcode from 'qrcode';
import readline from 'readline';

import { generateSignedToken } from '@/utils/token'; // ✅ Updated unified import
import type { TokenPayload } from '@/types/token';

export const runtime = 'nodejs';

const logPath = path.resolve(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');
const qrDir = path.resolve(process.cwd(), 'public/qr');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (q: string): Promise<string> =>
  new Promise((res) => rl.question(chalk.cyan(`${q}: `), res));

export async function generateFlow(): Promise<{
  token: string;
  payload: TokenPayload;
  qrPath: string;
}> {
  console.log(chalk.magentaBright(`\nAXPT.io Token Generator`));
  console.log(chalk.gray(`----------------------------`));

  const partner = await ask('Enter partner name (e.g., maya)');
  const tier = await ask('Enter tier (Investor, Board, Partner, Farmer, Merchant, Nomad)');

  const displayName = await ask('Display name (optional, e.g., Ma’yá)');
  const greeting = await ask('Greeting line (optional, e.g., Welcome to AXPT.io)');

  const allowedDocs = ['AXPT-Whitepaper.pdf', 'Hemp_Ecosystem.pdf', 'CIM_Chinje.pdf'];

  const defaultDocsByTier: Record<string, string[]> = {
    Investor: allowedDocs,
    Board: allowedDocs,
    Partner: ['AXPT-Whitepaper.pdf', 'Hemp_Ecosystem.pdf'],
    Farmer: ['Hemp_Ecosystem.pdf'],
    Merchant: ['CIM_Chinje.pdf'],
    Nomad: [],
  };

  let docs: string[] = [];
  const autoAssign = await ask('Auto-assign docs based on tier? (y/n)');
  if (autoAssign.toLowerCase() === 'y') {
    docs = defaultDocsByTier[tier] || [];
    console.log(chalk.yellow('✓ Docs auto-assigned:'), docs.join(', '));
  } else {
    const docsRaw = await ask(`Comma-separated docs [${allowedDocs.join(', ')}]`);
    docs = docsRaw
      .split(',')
      .map((d) => d.trim())
      .filter((d) => allowedDocs.includes(d));

    const invalidDocs = docsRaw
      .split(',')
      .map((d) => d.trim())
      .filter((d) => !allowedDocs.includes(d));

    if (invalidDocs.length > 0) {
      console.log(chalk.red(`⚠️ Ignored invalid docs:`), invalidDocs.join(', '));
    }
  }

  const payload: TokenPayload = {
    partner,
    tier: tier as TokenPayload['tier'],
    docs,
    displayName: displayName || undefined,
    greeting: greeting || undefined,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = generateSignedToken(payload);
  const qrPath = path.join(qrDir, `${partner}.png`);
  const qrUrl = `https://www.axpt.io/qr-view?token=${token}`;
  await qrcode.toFile(qrPath, qrUrl);

  const entry = { ...payload, token };
  const log = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    : [];
  log.unshift(entry);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

  console.log(chalk.green('✓ Token created for'), partner);
  console.log(chalk.blue('QR saved at:'), qrPath);

  rl.close();
  return { token, payload, qrPath };
}