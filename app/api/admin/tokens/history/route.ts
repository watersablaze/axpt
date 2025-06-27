// ✅ app/api/admin/tokens/history/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const logPath = path.resolve(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');

    const raw = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf-8')
      : '[]';

    const tokens = JSON.parse(raw);
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('❌ Failed to read token log:', error);
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}