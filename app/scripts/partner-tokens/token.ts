#!/usr/bin/env tsx
// ✅ FILE: app/scripts/partner-tokens/token.ts

import 'dotenv/config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { generateSignedToken } from '@/utils/token'; // ✅ Unified import
import type { TokenPayload } from '@/types/token';

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

  const token = generateSignedToken(payload);

  const dir = path.resolve('tokens');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${partner}.token.txt`);
  fs.writeFileSync(file, token);

  console.log(chalk.green('\n✅ Token generated:'));
  console.log(token);
  console.log(chalk.gray(`📁 Saved to: ${file}`));
};

run();