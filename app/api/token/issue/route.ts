// app/api/token/issue/route.ts

import { NextResponse } from 'next/server';
import { generateSignedToken } from '@/utils/token';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { partnerName, tier, docs = [] } = await req.json();

    if (!partnerName || !tier) {
      return NextResponse.json({ error: 'Missing partner name or tier' }, { status: 400 });
    }

    const payload = {
      partner: partnerName,
      tier,
      docs,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = generateSignedToken(payload);
    const onboardingUrl = `https://axpt.io/onboard?token=${token}`;

    // 📝 Logging skipped – TokenLog model not defined in Prisma
    // await prisma.tokenLog.create({
    //   data: {
    //     partnerName,
    //     tier,
    //     docs,
    //     token,
    //     issuedBy: 'public-api',
    //   },
    // });

    return NextResponse.json({
      success: true,
      token,
      onboardingUrl,
    });
  } catch (err: any) {
    console.error('[AXPT::token-issue]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}