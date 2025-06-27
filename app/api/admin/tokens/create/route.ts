// ✅ app/api/admin/tokens/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSignedToken } from '@/utils/token';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { partner, tier, docs } = await req.json();

    if (!partner || !tier || !docs || !Array.isArray(docs)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = {
      partner,
      tier,
      docs,
      iat: Math.floor(Date.now() / 1000), // ⏱️ Include issued-at timestamp
    };

    const token = generateSignedToken(payload);

    await prisma.revokedToken.create({
      data: {
        partner,
        tier,
        rawToken: token,
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}