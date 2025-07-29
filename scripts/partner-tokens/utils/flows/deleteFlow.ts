// app/scripts/partner-tokens/flows/deleteFlow.ts
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export function deleteFlow(partnerArg: string) {
  const logPath = path.resolve(process.cwd(), 'scripts/partner-tokens/logs/token-log.json');
  const qrPath = path.resolve(process.cwd(), `public/qr/${partnerArg}.png`);

  if (!fs.existsSync(logPath)) {
    console.error(chalk.red('❌ Log file not found at:'), chalk.gray(logPath));
    return;
  }

  const entries = JSON.parse(fs.readFileSync(logPath, 'utf-8')) as { partner: string }[];
  const updated = entries.filter(entry => entry.partner !== partnerArg);

  if (entries.length === updated.length) {
    console.log(chalk.yellow('⚠ No token entry found for partner:'), chalk.white(partnerArg));
  } else {
    fs.writeFileSync(logPath, JSON.stringify(updated, null, 2));
    console.log(chalk.green('✓ Token entry deleted for partner:'), chalk.white(partnerArg));
  }

  if (fs.existsSync(qrPath)) {
    fs.unlinkSync(qrPath);
    console.log(chalk.gray(`🗑 QR code removed at: ${qrPath}`));
  }
}