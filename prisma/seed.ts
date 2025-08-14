import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const entries = [
    {
      status: 'live',
      message: 'Heartbeat OK',
      createdAt: new Date(now.getTime() - 1 * 60 * 1000), // 1 min ago
    },
    {
      status: 'stale',
      message: 'Delayed response',
      createdAt: new Date(now.getTime() - 6 * 60 * 1000), // 6 min ago
    },
    {
      status: 'dead',
      message: 'No heartbeat received',
      createdAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 min ago
    },
    {
      status: 'live',
      message: 'Back online',
      createdAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
    },
  ];

  for (const entry of entries) {
    await prisma.dbPulseLog.create({ data: entry });
  }

  console.log('✅ Seeded DB Pulse Logs');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });