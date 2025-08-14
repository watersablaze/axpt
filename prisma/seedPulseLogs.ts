import { faker } from '@faker-js/faker';
import prompts from 'prompts';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

type StatusOption = 'healthy' | 'degraded' | 'offline';

const statusMap: Record<string, StatusOption> = {
  healthy: 'healthy',
  degraded: 'degraded',
  offline: 'offline',
};

async function seed() {
  console.log('\n🌐 AXPT DB Pulse Seeder\n---------------------------');

  const { types } = await prompts({
    type: 'multiselect',
    name: 'types',
    message: '✔ Which log types do you want to seed?',
    choices: Object.keys(statusMap).map((s) => ({ title: s, value: s })),
    min: 1,
  });

  for (const type of types) {
    const { count } = await prompts({
      type: 'number',
      name: 'count',
      message: `✔ How many '${type}' logs would you like to insert?`,
      min: 1,
    });

    const createdLogs = [];

    for (let i = 0; i < count; i++) {
      const minutesAgo = faker.number.int({ min: 1, max: 600 });
      const createdAt = faker.date.recent({ days: 10, refDate: new Date(Date.now() - minutesAgo * 60000) });

      const log = await prisma.dbPulseLog.create({
        data: {
          status: statusMap[type],
          message: faker.hacker.phrase(),
          createdAt,
        },
      });

      const createdLogs: any[] = [];
    }

    console.log(`✅ Inserted ${createdLogs.length} ${type} logs.`);
  }

  await prisma.$disconnect();
  console.log('\n🌱 Seeding complete. You may now reload your dashboard.\n');
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});