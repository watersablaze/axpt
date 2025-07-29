// 📁 cli/onboard.ts

import '@/lib/env/loadEnv';
import 'dotenv/config';

import chalk from 'chalk';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

import { promptAndGenerateToken } from '@/lib/token/tokenService';
import { verifyToken } from '@/lib/token/verifyToken';

const prisma = new PrismaClient();

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

  try {
    const tokenInfo = await promptAndGenerateToken();

    const verification = await verifyToken(tokenInfo.token);

    if (!verification.valid) {
      console.warn(chalk.red(`❌ Token verification failed:`), verification.error);
      throw new Error('Refusing to sync or log invalid token.');
    }

    const {
      partner,
      displayName,
      email,
      tier,
      docs,
      popupMessage,
    } = verification.payload;

    console.log(chalk.green(`🔐 Token verified for:`), chalk.yellow(partner));

    await prisma.partner.upsert({
      where: { slug: partner },
      update: {
        name: displayName || 'Unnamed Partner',
        tier,
        email: email ?? null,
        token: tokenInfo.token,
        docs,
      },
      create: {
        slug: partner,
        name: displayName || 'Unnamed Partner',
        tier,
        email: email ?? null,
        token: tokenInfo.token,
        docs,
      },
    });

    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'partner-onboard-log.jsonl');
    fs.mkdirSync(logDir, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      partner,
      name: displayName,
      email: email ?? null,
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
    console.log(chalk.green(`✅ Partner synced to DB: ${chalk.bold(displayName)} (${partner})`));
  } catch (err) {
    console.error(chalk.red('❌ Error during onboarding:'), err);
  } finally {
    await prisma.$disconnect();
  }
}

runOnboarding();