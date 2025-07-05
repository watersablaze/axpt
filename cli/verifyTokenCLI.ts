// cli/verifyTokenCLI.ts
import 'dotenv/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import clipboard from 'clipboardy';
import axios from 'axios';
import { verifyToken } from '../app/src/utils/token';
import { isTokenExpired } from '@/utils/token';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('🔑 Paste your full token:\n', async (token) => {
  console.log('\n🔍 Verifying token...');

  const payload = await verifyToken(token);

  if (!payload) {
    console.error(chalk.red('❌ Token verification failed.'));
    rl.close();
    return;
  }

  const { partner, tier, docs, iat } = payload;
  const issuedAt = new Date(iat * 1000);
  const expired = isTokenExpired(iat);

  const tierColors: Record<string, (text: string) => string> = {
    Investor: chalk.yellowBright,
    Partner: chalk.cyanBright,
    Farmer: chalk.greenBright,
    Merchant: chalk.blueBright,
    Nomad: chalk.magentaBright,
    Board: chalk.redBright,
  };

  const tierColor = tierColors[tier] || ((txt: string) => txt);

  // Copy token to clipboard
  try {
    clipboard.writeSync(token);
    console.log(chalk.gray('\n📋 Token copied to clipboard.\n'));
  } catch {
    console.warn(chalk.red('⚠️ Failed to copy to clipboard.'));
  }

  // Display summary
  console.table({
    Partner: partner,
    Tier: tierColor(tier),
    'Issued At': issuedAt.toLocaleString(),
    Expired: expired ? 'Yes' : 'No',
    'Valid Token': 'Yes',
  });

  console.log(`📄 Docs:`);
  docs.forEach((doc: string) => {
    console.log(`   - ${chalk.blueBright(doc)}`);
  });

  // Optional webhook
  const webhookUrl = process.env.TOKEN_VERIFICATION_WEBHOOK;
  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, {
        partner,
        tier,
        docs,
        token,
        valid: true,
        expired,
        timestamp: new Date().toISOString(),
      });
      console.log(chalk.gray('\n🌐 Webhook sent.'));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(chalk.red('⚠️ Webhook failed:'), message);
    }
  }

  // Log to file
  const logEntry = {
    partner,
    tier,
    docs,
    iat,
    token,
    timestamp: new Date().toISOString(),
    status: expired ? 'expired' : 'valid',
  };

  const logPath = path.join(process.cwd(), 'logs/token-verifications.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

  console.log(chalk.gray(`\n🧾 Log written to ${logPath}\n`));
  rl.close();
});