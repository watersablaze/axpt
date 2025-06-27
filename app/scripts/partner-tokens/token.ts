#!/usr/bin/env tsx
// ✅ FILE: app/scripts/partner-tokens/token.ts

import 'dotenv/config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { TokenPayload } from '@/types/token';

const generateSignedToken = (payload: TokenPayload, secret: string): string => {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}:${signature}`;
};

const run = async () => {
  console.log(chalk.cyan('🔐 AXPT.io Token CLI Generator'));
  console.log('──────────────────────────────');

  const answers = await inquirer.prompt([
    { type: 'input', name: 'partner', message: 'Partner ID (e.g. afro-tech-alliance):' },
    { type: 'list', name: 'tier', message: 'Access Tier:', choices: ['Investor', 'Board', 'Partner', 'Farmer', 'Merchant', 'Nomad'] },
    {
      type: 'checkbox',
      name: 'docs',
      message: 'Select docs:',
      choices: ['AXPT-Whitepaper.pdf', 'Hemp_Ecosystem.pdf', 'CIM_Chinje.pdf'],
    }
  ]);

  const { partner, tier, docs } = answers;

  const payload: TokenPayload = {
    partner,
    tier,
    docs,
    iat: Math.floor(Date.now() / 1000),
  };

  const secret = process.env.PARTNER_SECRET;
  if (!secret) {
    console.error(chalk.red('❌ Missing PARTNER_SECRET'));
    process.exit(1);
  }

  const token = generateSignedToken(payload, secret);
  const dir = path.resolve('tokens');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${payload.partner}.token.txt`);
  fs.writeFileSync(file, token);

  console.log(chalk.green('\n✅ Token generated:'));
  console.log(token);
  console.log(chalk.gray(`📁 Saved to: ${file}`));
};

run();