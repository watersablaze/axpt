// ✅ FILE: cli/token.ts

import 'dotenv/config';
import { generateFlow } from '@/flows/generateFlow';
import { decodeFlow } from '@/flows/decodeFlow';
import verifyFlow from '@/flows/verifyFlow'; // default-exported

import chalk from 'chalk';
import inquirer from 'inquirer';

async function run() {
  console.log(chalk.cyan('\n🧰 AXPT Token CLI Toolkit'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select action:',
      choices: ['Generate', 'Verify', 'Decode']
    }
  ]);

  if (action === 'Generate') {
    await generateFlow();
  } else if (action === 'Verify') {
    const { token } = await inquirer.prompt([
      { type: 'input', name: 'token', message: 'Paste token to verify:' }
    ]);
    verifyFlow(token);
  } else if (action === 'Decode') {
    const { token } = await inquirer.prompt([
      { type: 'input', name: 'token', message: 'Paste token to decode:' }
    ]);
    decodeFlow(token);
  }
}

run();