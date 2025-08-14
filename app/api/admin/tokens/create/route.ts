import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/token';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { partner, tier, docs } = await req.json();

    if (!partner || !tier || !docs || !Array.isArray(docs)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // 🔍 Look up the user by partnerSlug
    const user = await prisma.user.findFirst({
      where: { partnerSlug: partner },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = {
      partner,
      tier,
      docs,
      userId: user.id, // ✅ Required field
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signToken(payload); // ✅ Sign it

    // 🧾 Log the token to RevokedToken table (audit/history)
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