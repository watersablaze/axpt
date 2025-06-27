// ✅ FILE: app/scripts/partner-tokens/utils/flows/verifyFlow.ts

import 'dotenv/config';
import chalk from 'chalk';
import { verifyToken, decodeToken, isTokenExpired } from '@/utils/token';
import type { TokenPayload } from '@/types/token';

export default function verifyFlow(token: string) {
  const result = verifyToken(token) as TokenPayload | null;

  if (!result) {
    console.log(chalk.red('❌ Token is invalid or expired.'));
    return;
  }

  console.log(chalk.green('✅ Token is valid!\n'));
  console.log(chalk.bold('🔹 Partner:'), chalk.cyan(result.partner));
  console.log(chalk.bold('🔹 Tier:'), chalk.yellow(result.tier));
  console.log(chalk.bold('🔹 Docs:'), chalk.magenta(result.docs.join(', ')));

  const issuedAt = new Date(result.iat * 1000).toLocaleString();
  console.log(chalk.bold('🔹 Issued At:'), chalk.gray(issuedAt));

  if (result.exp) {
    const expiresAt = new Date(result.exp * 1000).toLocaleString();
    console.log(chalk.bold('🔹 Expires At:'), chalk.gray(expiresAt));
  }

  console.log();
}