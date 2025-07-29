#!/usr/bin/env tsx
// 📁 cli/token.ts

import '@/lib/env/loadEnv';
import 'dotenv/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { signToken, verifyToken, decodeToken } from '@/lib/token';

const logPath = path.resolve('app/scripts/partner-tokens/logs/token-log.json');

async function run() {
  console.log(chalk.cyan('\n🧰 AXPT Token CLI Toolkit'));
  console.log(chalk.gray('──────────────────────────────'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: ['Generate', 'Verify', 'Decode', 'List Log History']
    }
  ]);

  switch (action) {
    case 'Generate': {
      const { partner, tier, userId, docs } = await inquirer.prompt([
        { type: 'input', name: 'partner', message: 'Enter partner name:' },
        { type: 'input', name: 'tier', message: 'Enter tier:' },
        { type: 'input', name: 'userId', message: 'Enter user ID:' },
        {
          type: 'checkbox',
          name: 'docs',
          message: 'Select documents:',
          choices: ['whitepaper.pdf', 'chinje.pdf', 'hemp.pdf'],
        },
      ]);
      const payload = {
        partner,
        tier,
        docs,
        userId
      };
      const token = await signToken(payload);
      console.log(chalk.green('\n✅ Token Generated:'));
      console.log(token);
      break;
    }

    case 'Verify': {
      const { token } = await inquirer.prompt([
        { type: 'input', name: 'token', message: 'Paste token to verify:' }
      ]);
      const result = await verifyToken(token);
      if (result.valid) {
        console.log(chalk.green('✅ Token is valid!'));
        console.log(result.payload);
      } else {
        console.log(chalk.red('❌ Invalid token'));
      }
      break;
    }

    case 'Decode': {
      const { token } = await inquirer.prompt([
        { type: 'input', name: 'token', message: 'Paste token to decode:' }
      ]);
      const decoded = await decodeToken(token);
      if (decoded) {
        console.log(chalk.blue('🔎 Decoded Token:'));
        console.log(decoded);
      } else {
        console.log(chalk.red('❌ Failed to decode token.'));
      }
      break;
    }

    case 'List Log History':
      listTokenLog();
      break;
  }
}

function listTokenLog() {
  if (!fs.existsSync(logPath)) {
    console.log(chalk.yellow('⚠️ No token log found.'));
    return;
  }

  const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8'));

  if (!entries.length) {
    console.log(chalk.yellow('⚠️ Token log is empty.'));
    return;
  }

  console.log(chalk.magentaBright('\n📜 Token Log History:'));
  console.log(chalk.gray('──────────────────────────────'));

  entries.forEach((entry: any, i: number) => {
    const date = entry.iat ? new Date(entry.iat * 1000).toLocaleString() : 'Unknown';
    console.log(
      chalk.bold(`${i + 1}. ${entry.partner}`),
      chalk.gray(`[${entry.tier}]`),
      chalk.yellow(`→ ${date}`)
    );
    console.log(chalk.gray(`   Docs:`), chalk.cyan(entry.docs.join(', ')));
    console.log();
  });
}

run();