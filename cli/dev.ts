// FILE: cli/dev.ts
import '@/lib/env/loadEnv';

import chalk from 'chalk';
import clipboard from 'clipboardy';

import { signToken } from '@/lib/token';
import { TokenPayloadSchema } from '@/lib/token/tokenSchema';
import type { TokenPayload } from '@/types/token';

(async () => {
  const now = Math.floor(Date.now() / 1000);
const samplePayload: TokenPayload = {
  userId: 'test-user-id', // ✅
  partner: 'axpt',
  tier: 'Investor',
  docs: ['AXPT-Whitepaper.pdf'],
  displayName: 'Ma’yá',
  greeting: 'Welcome, time traveler.',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7,
};

  try {
    const validated = TokenPayloadSchema.parse(samplePayload);
    const token = await signToken(validated);

    clipboard.writeSync(token);
    console.log(chalk.green('\n✅ Token generated and copied to clipboard:\n'));
    console.log(chalk.gray(token));
  } catch (err) {
    if (err instanceof Error) {
      console.error(chalk.red('❌ Token generation failed:'), err.message);
    } else {
      console.error(chalk.red('❌ Unknown error:'), err);
    }
  }
})();