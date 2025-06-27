// cli/verifyTokenCLI.ts
import 'dotenv/config';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import clipboard from 'clipboardy';
import axios from 'axios';
import { decodeToken, verifyToken, isTokenExpired } from '../app/src/utils/token';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔑 Paste your full token:\n', async (token) => {
  console.log('\n🔍 Decoding token...');

  const decoded = decodeToken(token);

  if (!decoded) {
    console.error(chalk.red('❌ Failed to decode token.'));
    rl.close();
    return;
  }

  const { partner, tier, docs, iat } = decoded;
  const issuedAt = new Date(iat * 1000);
  const expired = isTokenExpired(token);
  const isValid = verifyToken(token);

  const tierColors: Record<string, chalk.Chalk> = {
    Investor: chalk.yellowBright,
    Partner: chalk.cyanBright,
    Farmer: chalk.greenBright,
    Nomad: chalk.magentaBright
  };
  const tierColor = tierColors[tier] || chalk.white;

  // Copy to clipboard
  try {
    clipboard.writeSync(token);
    console.log(chalk.gray('\n📋 Token copied to clipboard.\n'));
  } catch {
    console.warn(chalk.red('⚠️ Failed to copy to clipboard.'));
  }

  // Display token table
  console.table({
    Partner: partner,
    Tier: tier,
    'Issued At': issuedAt.toLocaleString(),
    Expired: expired ? 'Yes' : 'No',
    'Valid Token': isValid ? 'Yes' : 'No'
  });

  console.log(`📄 Docs:`);
  docs.forEach((doc: string) => {
    console.log(`   - ${chalk.blueBright(doc)}`);
  });

  // Webhook (optional, change URL)
  const webhookUrl = process.env.TOKEN_VERIFICATION_WEBHOOK;
  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, {
        partner,
        tier,
        docs,
        token,
        valid: isValid,
        expired,
        timestamp: new Date().toISOString()
      });
      console.log(chalk.gray('\n🌐 Webhook sent.'));
    } catch (err) {
      console.warn(chalk.red('⚠️ Webhook failed:'), err.message);
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
    status: isValid ? (expired ? 'expired' : 'valid') : 'invalid'
  };
  const logPath = path.join(process.cwd(), 'logs/token-verifications.jsonl');
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');

  console.log(chalk.gray(`\n🧾 Log written to ${logPath}\n`));

  rl.close();
});