import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const logPath = path.join(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');

export function fixTokenLog() {
  if (!fs.existsSync(logPath)) {
    console.error(chalk.red('❌ token-log.json not found at:'), chalk.gray(logPath));
    return;
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  let entries;

  try {
    entries = JSON.parse(content);
  } catch (err) {
    console.error(chalk.red('❌ Failed to parse JSON log:'), err);
    return;
  }

  let modified = false;

  const updated = entries.map((entry: any) => {
    if (entry.createdAt && !entry.issuedAt) {
      entry.issuedAt = entry.createdAt;
      delete entry.createdAt;
      modified = true;
    }
    return entry;
  });

  if (modified) {
    fs.writeFileSync(logPath, JSON.stringify(updated, null, 2));
    console.log(chalk.green('✅ Log updated. All `createdAt` fields replaced with `issuedAt`.'));
  } else {
    console.log(chalk.blue('ℹ️ No `createdAt` fields found. Log already clean.'));
  }
}