// app/scripts/check-db.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDB() {
  try {
    const result: any = await prisma.$queryRawUnsafe('SELECT NOW() as time');
    console.log('✅ Supabase DB reachable. Current time:', result[0].time);
  } catch (err) {
    console.error('❌ Cannot connect to Supabase DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();