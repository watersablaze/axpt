#!/usr/bin/env tsx
// 📁 cli/revoke.ts

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/token/verifyToken';
import { hashToken } from '@/lib/token/utils'; // We'll generate this
import chalk from 'chalk';
import { argv } from 'process';

const token = argv[2];
if (!token) {
  console.error(chalk.red('❌ You must pass a token to revoke.'));
  process.exit(1);
}

async function main() {
  try {
    const { valid, payload, error } = await verifyToken(token);
    if (!valid || !payload) {
      console.error(chalk.red('❌ Invalid token. Reason:'), error);
      return;
    }

    const hashed = hashToken(token);

    const exists = await prisma.revokedToken.findUnique({
      where: { rawToken: hashed },
    });

    if (exists) {
      console.warn(chalk.yellow('⚠️ Token already revoked.'));
      return;
    }

    await prisma.revokedToken.create({
      data: {
        rawToken: hashed,
        partner: payload.partner || 'unknown',
        tier: payload.tier || 'unknown',
        userId: payload.userId || null,
      },
    });

    console.log(chalk.green('✅ Token revoked successfully.'));
  } catch (err) {
    console.error(chalk.red('🔥 Error during revocation:'), err);
  } finally {
    await prisma.$disconnect();
  }
}

main();