import { decodeToken } from '@/lib/token/decodeToken';
import chalk from 'chalk';

export function decodeTokenCLIFlow(token: string) {
  try {
    const payload = decodeToken(token);
    console.log(chalk.cyan('🧬 Decoded Token Payload:'));
    console.dir(payload, { depth: null, colors: true });
  } catch (err: any) {
    console.error(chalk.red('❌ Failed to decode token:'), err.message);
    process.exit(1);
  }
}