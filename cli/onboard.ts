// 📁 cli/onboard.ts

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import figlet from 'figlet';

import { promptAndGenerateToken } from '@/lib/token/tokenService';
import { verifyToken } from '@/lib/token/verifyToken';
import { TokenPayload } from '@/types/token';

const isDryRun = process.argv.includes('--dry');

async function runOnboarding() {
  console.log(chalk.cyanBright(figlet.textSync('AXPT Onboard', { font: 'Slant' })));
  console.log(
    chalk.gray('='.repeat(60)) +
    '\n' +
    chalk.blueBright('🌍 Welcome to the AXPT Partner Onboarding CLI') +
    '\n' +
    chalk.gray('='.repeat(60)) +
    '\n'
  );

  if (!process.env.DATABASE_URL) {
    console.error(chalk.red('❌ Error: DATABASE_URL is not defined in the environment.'));
    console.warn(chalk.yellow('👉 Please ensure .env is present and loaded correctly.'));
    process.exit(1);
  }

  console.log(chalk.magenta(`🔌 DATABASE_URL:`), chalk.gray(process.env.DATABASE_URL));

  try {
    const tokenInfo = await promptAndGenerateToken();

    const verification = await verifyToken(tokenInfo.token);
    if (!verification.valid || !verification.payload) {
      console.warn(chalk.red(`❌ Token verification failed:`), verification.error);
      throw new Error('Refusing to sync or log invalid token.');
    }

    const payload = verification.payload as TokenPayload;

    const {
      partner,
      displayName,
      email,
      tier,
      docs,
      popupMessage,
    } = payload;

    console.log(chalk.green(`🔐 Token verified for:`), chalk.yellow(partner));

    if (isDryRun) {
      console.log(chalk.blueBright(`🚫 Dry run enabled — skipping DB sync and log write.`));
      return;
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    await prisma.$connect();

    let synced = false;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await prisma.partner.upsert({
          where: { slug: partner },
          update: {
            name: displayName || 'Unnamed Partner',
            tier,
            email: typeof email === 'string' ? email : null,
            token: tokenInfo.token,
            docs,
          },
          create: {
            slug: partner,
            name: displayName || 'Unnamed Partner',
            tier,
            email: typeof email === 'string' ? email : null,
            token: tokenInfo.token,
            docs,
          },
        });
        synced = true;
        console.log(chalk.green(`✅ Partner synced to DB: ${chalk.bold(displayName)} (${partner})`));
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        console.warn(chalk.yellow(`⚠️ DB sync failed, retrying (${attempt}/2)...`));
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'partner-onboard-log.jsonl');
    fs.mkdirSync(logDir, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      partner,
      name: displayName,
      email: typeof email === 'string' ? email : null,
      tier,
      docs,
      popupMessage,
      token: tokenInfo.token,
      tokenHash: tokenInfo.token.slice(-12),
      qrPath: tokenInfo.qrPath,
      source: 'cli',
    };

    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    console.log(chalk.gray(`🧾 Logged to:`), chalk.underline(logPath));

    await prisma.$disconnect();

  } catch (err: any) {
    console.error(chalk.red('❌ Error during onboarding:'));

    if (err.code === 'P1001') {
      console.error(chalk.redBright('🚫 Cannot reach database. Check Neon DB status and credentials.'));
    }

    console.error(chalk.gray(err?.message || err));
    process.exit(1);
  }
}

runOnboarding();
