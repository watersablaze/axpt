// app/api/admin/tokens/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { TokenPayload } from '@/types/token';

export async function GET() {
  try {
    const logPath = path.resolve(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');

    if (!fs.existsSync(logPath)) {
      return NextResponse.json([], { status: 200 });
    }

    const raw = fs.readFileSync(logPath, 'utf-8');
    const tokens: (TokenPayload & { token?: string })[] = JSON.parse(raw);

    const enrichedTokens = tokens.map((t) => ({
      ...t,
      tokenString: t.token || '[not logged]', // fallback for older entries
      qrPath: `/qr/${t.partner}.png`,
    }));

    return NextResponse.json(enrichedTokens);
  } catch (error) {
    console.error('❌ Failed to load token log:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}