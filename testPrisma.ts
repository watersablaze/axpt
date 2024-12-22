import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection...');
    const users = await prisma.user.findMany(); // Replace "user" with your model
    console.log('Retrieved users:', users);
  } catch (error) {
    console.error('Error querying the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();