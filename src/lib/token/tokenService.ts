// 📁 src/lib/token/tokenService.ts

import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import chalk from 'chalk';
import clipboard from 'clipboardy';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

import { signToken } from '@/lib/token/signToken';
import { generateTokenPayload } from '@/lib/token/generateTokenPayload';
import { allowedDocEnum } from '@/lib/token/tokenSchema';
import type { z } from 'zod';

export type AllowedDoc = z.infer<typeof allowedDocEnum>;
export const ALLOWED_DOCS = allowedDocEnum.options;

export type TokenInput = {
  partner: string;
  tier: string;
  docs?: AllowedDoc[];
  displayName?: string;
  greeting?: string;
  popupMessage?: string;
  userId: string;
  iat?: number;
  exp?: number;
  email?: string;
};

export type TokenEntry = {
  token: string;
  payload: ReturnType<typeof generateTokenPayload> & { token: string };
  qrPath: string;
  createdAt: Date;
};

// === MAIN GENERATOR ===
export async function generateTokenFromInput(input: TokenInput): Promise<TokenEntry> {
  const payload = generateTokenPayload(input);
  const token = await signToken(payload);

  const qrDir = path.resolve(process.cwd(), 'public/qr');
  if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

  const qrPath = path.join(qrDir, `${input.partner}.png`);
  const qrURL = `https://www.axpt.io/onboard?token=${token}`;

  await qrcode.toFile(qrPath, qrURL, {
    margin: 1,
    width: 400,
    color: { dark: '#000000', light: '#ffffff' },
  });

  clipboard.writeSync(token);
  const createdAt = new Date();

  const logPath = path.join(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logEntry = { ...payload, token, qrPath, createdAt: createdAt.toISOString() };

  let logs: any[] = [];
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf-8');
      const existing = JSON.parse(content);
      if (Array.isArray(existing)) logs = existing;
    }
  } catch (err) {
    console.warn('⚠️ Failed to read existing log:', err);
  }

  logs.unshift(logEntry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  console.log(chalk.green(`\n✓ Token generated for:`), chalk.cyan(input.partner));
  console.log(chalk.cyan(`🎖️ Tier:`), input.tier);
  console.log(chalk.gray(`📄 Docs:`), input.docs?.join(', '));
  console.log(chalk.magenta(`📌 QR saved to:`), chalk.gray(qrPath));
  console.log(chalk.yellow(`🔗 Token:`), chalk.white(token));

  try {
    execSync('printf "\a"');
  } catch {}

  return {
    token,
    payload: { ...payload, token },
    qrPath,
    createdAt,
  };
}

// === OPTIONAL INTERACTIVE PROMPT WRAPPER ===
export async function promptAndGenerateToken(): Promise<TokenEntry> {
  const EXPIRATION_OPTIONS = [
    { name: '24 hours', seconds: 60 * 60 * 24 },
    { name: '3 days', seconds: 60 * 60 * 24 * 3 },
    { name: '7 days', seconds: 60 * 60 * 24 * 7 },
    { name: '30 days', seconds: 60 * 60 * 24 * 30 },
    { name: '90 days', seconds: 60 * 60 * 24 * 90 },
  ];

  const DOC_CHOICES = ALLOWED_DOCS.map(doc => ({
    name:
      doc === 'whitepaper'
        ? 'AXPT Whitepaper'
        : doc === 'chinje'
        ? 'CIM Chinje Report'
        : doc === 'hemp'
        ? 'Hemp Ecosystem Overview'
        : doc,
    value: doc,
  }));

  const answers = await inquirer.prompt([
    { type: 'input', name: 'partner', message: '🧿 Partner slug (e.g., mansa-mussa):' },
    { type: 'input', name: 'displayName', message: '🧠 Full name of partner:' },
    { type: 'input', name: 'email', message: '📧 Partner email (optional):' },
    {
      type: 'list',
      name: 'tier',
      message: '🎖️ Select tier:',
      choices: ['Investor', 'Project Manager', 'Nomad', 'Creative Producer'],
    },
    {
      type: 'checkbox',
      name: 'docs',
      message: '📄 Select documents:',
      choices: DOC_CHOICES,
    },
    { type: 'input', name: 'popupMessage', message: '✨ Custom popup message (optional):' },
    { type: 'input', name: 'greeting', message: '👋 Custom greeting (optional):' },
    {
      type: 'list',
      name: 'expChoice',
      message: '⏳ Choose token expiration:',
      choices: EXPIRATION_OPTIONS.map(opt => opt.name),
    },
  ]);

  const selected = EXPIRATION_OPTIONS.find(opt => opt.name === answers.expChoice);
  const exp = selected ? Math.floor(Date.now() / 1000) + selected.seconds : undefined;

  return generateTokenFromInput({
    ...answers,
    exp,
    userId: `cli-${answers.partner}`,
  });
}