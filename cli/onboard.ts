// cli/onboard.ts

import 'dotenv/config';
import chalk from 'chalk';
import inquirer from 'inquirer';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { generateTokenForCLI, TokenEntry } from './generateTokenForCLI';

const prisma = new PrismaClient();

async function runOnboarding() {
  // === Welcome Banner ===
  console.log(chalk.cyanBright(figlet.textSync('AXPT Onboard', { font: 'Slant' })));
  console.log(
    chalk.gray('='.repeat(60)) +
      '\n' +
      chalk.blueBright('🌍 Welcome to the AXPT Partner Onboarding CLI') +
      '\n' +
      chalk.gray('='.repeat(60)) +
      '\n'
  );

  // === Collect Partner Info ===
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'slug',
      message: '🧬 Partner slug (e.g., maya-redding):',
      validate: (val) => val.trim().length > 0 || 'Slug is required.',
    },
    {
      type: 'input',
      name: 'name',
      message: '🧠 Full name of partner:',
      validate: (val) => val.trim().length > 0 || 'Name is required.',
    },
    {
      type: 'input',
      name: 'email',
      message: '📧 Partner email (optional):',
    },
    {
      type: 'list',
      name: 'tier',
      message: '🎖️ Select tier:',
      choices: ['Crown', 'Investor', 'Board', 'Farmer', 'Merchant', 'Nomad'],
    },
    {
      type: 'checkbox',
      name: 'docs',
      message: '📄 Select documents:',
      choices: ['AXPT-Whitepaper.pdf', 'Hemp_Ecosystem.pdf', 'CIM_Chinje.pdf'],
    },
  ]);

  const { slug, name, email, tier, docs } = answers;
  const safeEmail = email?.trim() || undefined;

  let tokenInfo: TokenEntry;
  try {
    // === Generate Signed Token ===
    tokenInfo = await generateTokenForCLI(slug, tier, docs);

    console.log(chalk.green('\n🎉 Token Generated'));
    console.log(chalk.cyan(`👤 ${chalk.bold(name)} (${slug})`));
    console.log(chalk.cyan(`🎖️ Tier:`), chalk.yellowBright(tier));
    console.log(chalk.gray(`📋 Token copied to clipboard.`));
    console.log(chalk.gray(`🗂️ QR Path:`), chalk.underline(tokenInfo.qrPath));
    console.log(chalk.gray(`📅 Timestamp:`), tokenInfo.createdAt);
    console.log('');
  } catch (err) {
    console.error(chalk.red('❌ Failed to generate token:'), err);
    process.exit(1);
  }

  // === Sync to DB ===
  try {
    await prisma.partner.upsert({
      where: { slug },
      update: {
        name,
        tier,
        email: safeEmail,
        token: tokenInfo.token,
        docs,
      },
      create: {
        slug,
        name,
        tier,
        email: safeEmail,
        token: tokenInfo.token,
        docs,
      },
    });

    console.log(chalk.green(`✅ Partner synced to DB: ${chalk.bold(name)} (${slug})`));
  } catch (err) {
    console.error(chalk.red('❌ Failed to sync to database:'), err);
    process.exit(1);
  }

  // === Log Snapshot to JSONL File ===
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'partner-onboard-log.jsonl');
    fs.mkdirSync(logDir, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      partner: slug,
      name,
      email: safeEmail,
      tier,
      docs,
      token: tokenInfo.token,
      tokenHash: tokenInfo.token.slice(-12),
      qrPath: tokenInfo.qrPath,
      source: 'cli',
    };

    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    console.log(chalk.gray(`🧾 Logged to:`), chalk.underline(logPath));
  } catch (err) {
    console.error(chalk.red('❌ Failed to log onboarding:'), err);
  }

  await prisma.$disconnect();
}

runOnboarding();