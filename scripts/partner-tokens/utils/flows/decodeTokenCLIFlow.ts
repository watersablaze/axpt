// FILE: app/scripts/partner-tokens/utils/flows/decodeTokenCLIFlow.ts

import { decodeTokenCLIFlow as decodeTokenImpl } from 'staging/decodeTokenCLIFlow';
import chalk from 'chalk';

/**
 * CLI wrapper for decoding AXPT token
 */
export function decodeFlow(token: string) {
  try {
    decodeTokenImpl(token);
  } catch (err: any) {
    console.error(chalk.red('❌ Failed to decode token:'), err.message);
    process.exit(1);
  }
}