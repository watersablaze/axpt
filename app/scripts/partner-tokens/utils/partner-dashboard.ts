#!/usr/bin/env tsx

import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateFlow } from './flows/generateFlow';
import verifyFlow from './flows/verifyFlow';
import { deleteFlow } from './flows/deleteFlow';
import { listLog } from './flows/listLog';

async function main() {
  console.log(chalk.magentaBright(`\nAXPT.io Partner Token CLI`));
  console.log(chalk.gray('──────────────────────────────'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🔐 Generate new token', value: 'generate' },
        { name: '✅ Verify token', value: 'verify' },
        { name: '🗑 Delete token', value: 'delete' },
        { name: '📜 View log entries', value: 'list' },
        { name: '❌ Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'generate':
      await generateFlow();
      break;

    case 'verify': {
      const { token } = await inquirer.prompt([
        {
          type: 'input',
          name: 'token',
          message: 'Paste token to verify:',
        },
      ]);
      verifyFlow(token);
      break;
    }

    case 'delete': {
      const { partner } = await inquirer.prompt([
        {
          type: 'input',
          name: 'partner',
          message: 'Enter partner name to delete:',
        },
      ]);
      deleteFlow(partner);
      break;
    }

    case 'list':
      listLog();
      break;

    case 'exit':
    default:
      console.log(chalk.gray('Goodbye.'));
      process.exit(0);
  }
}

main().catch((err) => {
  console.error(chalk.red('Unhandled error in CLI:'), err);
  process.exit(1);
});