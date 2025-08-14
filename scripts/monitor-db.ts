// 📁 scripts/monitor-db.ts
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

async function monitorDB() {
  const timestamp = new Date().toISOString();
  const logFile = path.join(process.cwd(), 'logs', 'db-monitor.log');

  try {
    const result = await prisma.user.findFirst(); // replace with any safe query
    const logLine = `[${timestamp}] ✅ DB is responsive\n`;

    // Write to log file
    fs.appendFileSync(logFile, logLine);

    // Write to DB
    await prisma.dbPulseLog.create({
      data: {
        status: 'OK',
        message: 'DB responsive',
      },
    });

    console.log(logLine.trim());
  } catch (err: any) {
    const logLine = `[${timestamp}] ❌ DB check failed: ${err.message}\n`;
    fs.appendFileSync(logFile, logLine);

    await prisma.dbPulseLog.create({
      data: {
        status: 'ERROR',
        message: err.message || 'Unknown failure',
      },
    });

    console.error(logLine.trim());
  } finally {
    await prisma.$disconnect();
  }
}

monitorDB();