// scripts/analyzeViewLogs.ts
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  route: string;
  source: 'qr' | 'manual' | 'link';
  partner: string;
  tier: string;
  docs: string[];
  iat: number;
  userAgent?: string;
}

function analyzeLogs() {
  const logPath = path.join(process.cwd(), 'logs', 'partner-view-logs.jsonl');

  if (!fs.existsSync(logPath)) {
    console.error('Log file not found.');
    process.exit(1);
  }

  const entries: LogEntry[] = fs
    .readFileSync(logPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const summary = {
    total: entries.length,
    bySource: {} as Record<string, number>,
    byPartner: {} as Record<string, number>,
    byTier: {} as Record<string, number>,
  };

  for (const entry of entries) {
    summary.bySource[entry.source] = (summary.bySource[entry.source] || 0) + 1;
    summary.byPartner[entry.partner] = (summary.byPartner[entry.partner] || 0) + 1;
    summary.byTier[entry.tier] = (summary.byTier[entry.tier] || 0) + 1;
  }

  console.log('\n📊 View Log Summary');
  console.log('----------------------');
  console.log(`🔢 Total Views: ${summary.total}`);
  console.log('\n📌 By Source:', summary.bySource);
  console.log('🧩 By Partner:', summary.byPartner);
  console.log('🏷️  By Tier:', summary.byTier);
  console.log('----------------------\n');
}

analyzeLogs();