#!/usr/bin/env tsx

import 'dotenv/config';
import prompts from 'prompts';
import { execSync } from 'child_process';
import chalk from 'chalk';

(async () => {
  console.clear();
  console.log(chalk.cyanBright('\n🔐 AXPT Token CLI Dashboard'));
  console.log(chalk.gray('-----------------------------------'));

  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: 'Generate Partner Token', value: 'generate' },
      { title: 'Verify Token (auto open)', value: 'verify' },
      { title: 'Lookup Partner Info', value: 'lookup' },
      { title: 'List All Partners + Tiers', value: 'list' },
      { title: 'Debug Live Token (Vercel)', value: 'debug-live' },
      { title: 'Sync Local + Remote ENV', value: 'sync-env' },
      { title: 'Exit', value: 'exit' },
    ]
  });

  if (!response.action || response.action === 'exit') {
    console.log(chalk.gray('\n👋 Goodbye.'));
    process.exit(0);
  }

  const exec = (cmd: string) => execSync(cmd, { stdio: 'inherit' });

  switch (response.action) {
    case 'generate': {
      const { name } = await prompts({
        type: 'text',
        name: 'name',
        message: 'Enter partner name:'
      });
      if (!name) return;
      exec(`npx tsx bin/token-invite.ts "${name}"`);
      break;
    }
    case 'verify': {
      const { token } = await prompts({
        type: 'text',
        name: 'token',
        message: 'Paste token to verify:'
      });
      if (!token) return;
      exec(`npx tsx bin/verify-token.ts "${token}"`);
      break;
    }
    case 'lookup': {
      const { name } = await prompts({
        type: 'text',
        name: 'name',
        message: 'Enter partner name to lookup:'
      });
      if (!name) return;
      exec(`bin/token lookup "${name}"`);
      break;
    }
    case 'list': {
      exec(`bin/token list`);
      break;
    }
    case 'debug-live': {
      const { token } = await prompts({
        type: 'text',
        name: 'token',
        message: 'Paste token to test against LIVE environment:'
      });
      if (!token) return;
      exec(`bin/token debug-live "${token}"`);
      break;
    }
    case 'sync-env': {
      exec(`bin/token sync-env`);
      break;
    }
  }
})();
