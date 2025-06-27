// app/scripts/partner-tokens/flows/listLog.ts
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function listLog() {
  const logPath = path.resolve(process.cwd(), 'scripts/partner-tokens/logs/token-log.json');

  if (!fs.existsSync(logPath)) {
    console.log(chalk.yellow('⚠ No token log found.'));
    return;
  }

  const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8')) as { partner: string; file?: string }[];

  console.log(chalk.blueBright(`\n📘 ${entries.length} Tokens Logged:`));
  entries.forEach((e, i) => {
    const fileInfo = e.file ? chalk.cyan(`-> ${e.file}`) : chalk.dim('(no QR code)');
    console.log(chalk.gray(`${i + 1}.`), chalk.white(e.partner), fileInfo);
  });
}