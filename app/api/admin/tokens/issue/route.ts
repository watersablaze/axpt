// ✅ FILE: app/api/admin/tokens/issue/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/token';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
  try {
    const { partner, tier, docs } = await req.json();

    if (!partner || !tier || !Array.isArray(docs)) {
      return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
    }

    // 🔍 Find the user based on partnerSlug
    const user = await prisma.user.findFirst({
      where: { partnerSlug: partner },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found for partnerSlug' }, { status: 404 });
    }

    // 🧾 Build payload
    const payload = {
      partner,
      tier,
      docs,
      userId: user.id, // ✅ This is what was missing
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signToken(payload);

    // 🗃️ Log token to file
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