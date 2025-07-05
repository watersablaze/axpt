// FILE: cli/decodeTokenCLI.ts

import 'dotenv/config';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { decodeToken } from '@/utils/token';
import type { TokenPayload } from '@/types/token';

async function runDecoder() {
  console.clear();
  console.log(chalk.cyanBright('\n🔍 AXPT Token Decoder'));
  console.log(chalk.gray('──────────────────────────────'));

  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: '✔ Paste a token to decode:',
      validate: (val) => val.trim().length > 10 || 'Token seems too short.',
    },
  ]);

  const decoded = decodeToken(token);

  if (!decoded) {
    console.log(chalk.red('❌ Token could not be decoded.'));
    process.exit(1);
  }

  const { partner, tier, docs, iat } = decoded as TokenPayload;

  console.log(chalk.green('✅ Decoded Payload:\n'));
  console.log(chalk.cyan('Partner:'), chalk.white(partner));
  console.log(chalk.cyan('Tier:'), chalk.white(tier));
  console.log(chalk.cyan('Docs:'), chalk.white(docs.join(', ')));
  console.log(chalk.cyan('🕒 Issued At:'), chalk.yellow(new Date(iat * 1000).toLocaleString()));
  console.log('');
}

runDecoder();