// 📁 app/scripts/partner-tokens/utils/partner-dashboard.ts

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { promptAndGenerateToken } from '@/lib/token/tokenService';
import type { TokenEntry } from '@/lib/token/tokenService';

export async function generateFlow(): Promise<void> {
  console.log(chalk.blue('\n🛠 AXPT Partner Dashboard Flow Initiated'));

  try {
    const result = await promptAndGenerateToken() as TokenEntry;

    console.log(chalk.green('\n🎉 Token Successfully Created'));
    console.log(chalk.cyan(`👤 Partner:`), result.payload.partner);
    console.log(chalk.cyan(`🎖️ Tier:`), result.payload.tier);
    console.log(chalk.cyan(`📄 Docs:`), result.payload.docs.join(', '));
    console.log(chalk.cyan(`🔑 Token:`), result.token);
    console.log(chalk.cyan(`📦 QR Code Path:`), result.qrPath);
    console.log(chalk.cyan(`🕓 Created At:`), result.createdAt);

    // Optional: write out a pretty log file to /logs
    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'dashboard-gen-log.jsonl');
    fs.mkdirSync(logDir, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      partner: result.payload.partner,
      tier: result.payload.tier,
      docs: result.payload.docs,
      token: result.token,
      tokenHash: result.token.slice(-12),
      qrPath: result.qrPath,
      source: 'dashboard',
    };

    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    console.log(chalk.gray(`🧾 Logged to:`), chalk.underline(logPath));
  } catch (error) {
    console.error(chalk.red('❌ Error during flow:'), error);
  }
}