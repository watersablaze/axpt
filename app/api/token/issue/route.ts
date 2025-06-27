// app/api/token/issue/route.ts
import { NextResponse } from 'next/server';
import { generateSignedToken } from '@/utils/token';
import { prisma } from '@/lib/db'; // adjust path if needed

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { partnerName, tier, docs = [] } = await req.json();

    if (!partnerName || !tier) {
      return NextResponse.json({ error: 'Missing partner name or tier' }, { status: 400 });
    }

    const token = generateSignedToken({ partnerName, tier, docs });
    const onboardingUrl = `https://axpt.io/onboard?token=${token}`;

    await prisma.tokenLog.create({
      data: {
        partnerName,
        tier,
        docs,
        token,
        issuedBy: 'public-api',
      },
    });

    return NextResponse.json({
      success: true,
      token,
      onboardingUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}