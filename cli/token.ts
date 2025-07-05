#!/usr/bin/env tsx

import 'dotenv/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

import { generateFlow } from '@/flows/generateFlow';
import { decodeFlow } from '@/flows/decodeFlow';
import verifyFlow from '@/flows/verifyFlow'; // default export

// 🔐 Path to the token log
const logPath = path.resolve('app/scripts/partner-tokens/logs/token-log.json');

// 🧭 Main Menu
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
    case 'Generate':
      await generateFlow();
      break;

    case 'Verify':
      const { token: verifyTokenInput } = await inquirer.prompt([
        { type: 'input', name: 'token', message: 'Paste token to verify:' }
      ]);
      verifyFlow(verifyTokenInput);
      break;

    case 'Decode':
      const { token: decodeTokenInput } = await inquirer.prompt([
        { type: 'input', name: 'token', message: 'Paste token to decode:' }
      ]);
      decodeFlow(decodeTokenInput);
      break;

    case 'List Log History':
      listTokenLog();
      break;
  }
}

// 📖 Display Token History
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