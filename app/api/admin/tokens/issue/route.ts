// app/api/admin/tokens/issue/route.ts ✅
import { NextRequest, NextResponse } from 'next/server';
import { generateSignedToken } from '@/utils/token';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { partner, tier, docs } = await req.json();

    if (!partner || !tier || !Array.isArray(docs)) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    const payload = {
      partner,
      tier,
      docs,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = generateSignedToken(payload);

    const logPath = path.join(process.cwd(), 'app/scripts/partner-tokens/logs/token-log.json');
    const logEntry = {
      partner,
      tier,
      docs,
      token,
      issuedAt: new Date().toISOString(),
    };

    let logData: any[] = [];

    if (fs.existsSync(logPath)) {
      try {
        const content = fs.readFileSync(logPath, 'utf-8');
        logData = JSON.parse(content);
      } catch {
        console.warn('⚠️ Could not parse existing log. Starting fresh.');
      }
    }

    logData.unshift(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('❌ Token issuance failed:', error);
    return NextResponse.json({ error: 'Token issuance failed' }, { status: 500 });
  }
}