// 📁 lib/db-monitor/db-monitor-core.ts

import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { wakeDatabase } from '@/scripts/wake-db';

const LOG_DIR = path.resolve(__dirname, '../../../logs');
const LOG_FILE = path.join(LOG_DIR, 'db-monitor.log');

export type DBMonitorStatus = {
  timestamp: string;
  status: 'active' | 'idle' | 'error';
  message: string;
};

export async function monitorDB(): Promise<DBMonitorStatus> {
  const timestamp = new Date().toISOString();

  try {
    await prisma.user.findFirst();
    const status: DBMonitorStatus = {
      timestamp,
      status: 'active',
      message: 'Database is reachable.',
    };
    writeToLog(status);
    return status;
  } catch (err: any) {
    const status: DBMonitorStatus = {
      timestamp,
      status: 'idle',
      message: 'Database unreachable. Attempting wake-up...',
    };
    writeToLog(status);

    // Try waking it
    const woke = await wakeDatabase();
    const postWakeStatus: DBMonitorStatus = {
      timestamp,
      status: woke ? 'active' : 'error',
      message: woke ? 'DB woke successfully.' : 'Wake-up failed.',
    };
    writeToLog(postWakeStatus);
    return postWakeStatus;
  }
}

function writeToLog(entry: DBMonitorStatus) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
  const line = `[${entry.timestamp}] [${entry.status.toUpperCase()}] ${entry.message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}