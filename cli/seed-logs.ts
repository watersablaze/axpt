// =============================
// ✅ CLI Seeder: cli/seed-logs.ts
// =============================

import { PrismaClient } from '@prisma/client';
import inquirer from 'inquirer';
import chalk from 'chalk';

const prisma = new PrismaClient();

const statusPresets = {
  live: {
    minutesAgo: 1,
    status: 'live',
    message: 'DB responding normally',
  },
  stale: {
    minutesAgo: 5,
    status: 'stale',
    message: 'Pulse delay detected',
  },
  dead: {
    minutesAgo: 30,
    status: 'dead',
    message: 'Database is unreachable',
  },
};

async function main() {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Which pulse type would you like to insert?',
      choices: ['live', 'stale', 'dead'],
    },
  ]);

  const preset = statusPresets[choice as keyof typeof statusPresets];
  const date = new Date(Date.now() - preset.minutesAgo * 60 * 1000);

  const result = await prisma.dbPulseLog.create({
    data: {
      status: preset.status,
      message: preset.message,
      createdAt: date,
    },
  });

  console.log(chalk.greenBright(`✅ Inserted ${preset.status.toUpperCase()} log at ${date.toISOString()}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });