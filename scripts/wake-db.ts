// 📁 scripts/wake-db.ts
import { prisma } from '@/infrastructure/db/prisma';

async function wakeDB() {
  try {
    console.log('⏰ Waking up the database...');
    await prisma.user.findFirst(); // or any table that exists
    console.log('✅ DB awake.');
    process.exit(0);
  } catch (err) {
    console.error('❌ DB wake-up failed:', err);
    process.exit(1);
  }
}

export async function wakeDatabase() {
  // simple dummy query to wake the DB
  const res = await fetch('https://axpt.io/api/db-status'); // or any live endpoint hitting DB
  return res.ok;
}

wakeDB();