// ✅ FILE: app/scripts/partner-tokens/utils/flows/decodeFlow.ts

import chalk from 'chalk';
import { decodeToken } from '@/utils/token';

export function decodeFlow(token: string) {
  const decoded = decodeToken(token);

  if (!decoded) {
    console.error(chalk.red('❌ Failed to decode token.'));
    process.exit(1);
  }

  console.log(chalk.green('\n✅ Decoded Payload:\n'));
  console.log(JSON.stringify(decoded, null, 2));

  if (decoded.exp) {
    const expDate = new Date(decoded.exp * 1000).toLocaleString();
    console.log(chalk.yellow(`⏳ Expires At: ${expDate}`));
  }

  if (decoded.iat) {
    const iatDate = new Date(decoded.iat * 1000).toLocaleString();
    console.log(chalk.gray(`🕒 Issued At: ${iatDate}`));
  }

  console.log();
}