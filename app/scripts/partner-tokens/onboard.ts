// ✅ FILE: app/scripts/partner-tokens/onboard.ts

import 'dotenv/config';
import chalk from 'chalk';
import { PrismaClient } from '@prisma/client';
import { generateFlow } from './utils/flows/generateFlow';

const prisma = new PrismaClient();

(async () => {
  const { token, payload } = await generateFlow();

  try {
    await prisma.partner.create({
      data: {
        name: payload.partner,
        slug: payload.partner.toLowerCase().replace(/\s+/g, '-'),
        tier: payload.tier,
        token,
        docs: payload.docs, // ✅ correctly matches schema
        createdAt: new Date(payload.iat * 1000),
      },
    });

    console.log(chalk.green(`✅ Synced to DB: ${payload.partner}`));
  } catch (e) {
    console.error(chalk.red('❌ DB sync failed'), e);
  } finally {
    await prisma.$disconnect();
  }
})();