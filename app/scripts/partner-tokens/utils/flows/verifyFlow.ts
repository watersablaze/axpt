// ✅ FILE: app/scripts/partner-tokens/utils/flows/verifyFlow.ts

import 'dotenv/config';
import chalk from 'chalk';

import {
  verifyToken,
  decodeToken,
  isTokenExpired,
} from '@/utils/token';

import type { TokenPayload } from '@/types/token';

export default function verifyFlow(token: string) {
  const result = verifyToken(token) as TokenPayload | null;

  if (!result) {
    console.log(chalk.red('❌ Token is invalid, malformed, or expired.'));
    return;
  }

  console.log(chalk.green('\n✅ Token is valid and verified!\n'));
  console.log(chalk.bold('🔹 Partner:'), chalk.cyan(result.partner));
  console.log(chalk.bold('🔹 Tier:'), chalk.yellow(result.tier));
  console.log(chalk.bold('🔹 Docs:'), chalk.magenta(result.docs.join(', ')));

  if (result.iat) {
    const issuedAt = new Date(result.iat * 1000).toLocaleString();
    console.log(chalk.gray(`🕒 Issued At: ${issuedAt}`));
  }

  if (result.exp) {
    const expiresAt = new Date(result.exp * 1000).toLocaleString();
    console.log(chalk.yellow(`⏳ Expires At: ${expiresAt}`));
  }

  console.log();
}