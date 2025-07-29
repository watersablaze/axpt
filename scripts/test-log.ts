import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testLog() {
  try {
    const result = await prisma.sessionLog.create({
      data: {
        userId: 'test-user-id', // Ensure this exists!
        ip: '127.0.0.1',
        location: 'Testville',
        action: 'manual-test',
        details: { note: 'Manual test entry' }, // ✅ must be a JSON object, not a string
      },
    });
    console.log('✅ Log entry created:', result);
  } catch (err) {
    console.error('❌ Failed to insert log:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testLog();