// ✅ FILE: cli/utils/fixTokenLog.ts
import '@/lib/env/loadEnv';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const logPath = path.join(process.cwd(), 'logs/token-verifications.jsonl');

/**
 * Reads the token-verifications JSONL log and replaces any `createdAt`
 * fields with `issuedAt` for consistency.
 */
export function fixTokenLog() {
  if (!fs.existsSync(logPath)) {
    console.error(chalk.red('❌ Log not found at:'), chalk.gray(logPath));
    return;
  }

  const lines = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean);
  const fixedLines = lines.map((line) => {
    try {
      const entry = JSON.parse(line);
      if (entry.createdAt && !entry.issuedAt) {
        entry.issuedAt = entry.createdAt;
        delete entry.createdAt;
      }
      return JSON.stringify(entry);
    } catch (err) {
      console.warn(chalk.yellow('⚠️ Skipping invalid JSON entry.'));
      return line;
    }
  });

  fs.writeFileSync(logPath, fixedLines.join('\n'));
  console.log(chalk.green('✅ Token log successfully normalized.'));
}