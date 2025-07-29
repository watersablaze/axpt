// ✅ FILE: app/scripts/partner-tokens/onboard.ts

import '@/lib/env/loadEnv';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import { promptAndGenerateToken as generateTokenCLIFlow } from '@/lib/token/tokenService';

const prisma = new PrismaClient();

(async () => {
  try {
    const { token, payload } = await generateTokenCLIFlow();

    await prisma.partner.upsert({
      where: { slug: payload.partner },
      update: {
        name: payload.displayName ?? payload.partner,
        tier: payload.tier,
        token,
        docs: payload.docs,
        email: payload.email ?? null,
      },
      create: {
        slug: payload.partner,
        name: payload.displayName ?? payload.partner,
        tier: payload.tier,
        token,
        docs: payload.docs,
        email: payload.email ?? null,
        createdAt: payload.iat ? new Date(payload.iat * 1000) : new Date(),
      },
    });

    console.log(chalk.green(`✅ Synced to DB: ${payload.partner}`));
  } catch (err) {
    console.error(chalk.red('❌ Failed to onboard partner:'), err);
  } finally {
    await prisma.$disconnect();
  }
})();