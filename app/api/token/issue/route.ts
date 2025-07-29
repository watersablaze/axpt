import { NextResponse } from 'next/server';
import { signToken } from '@/lib/token/signToken'; // ✅ Correct import
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { partnerName, tier, docs = [] } = await req.json();

    if (!partnerName || !tier) {
      return NextResponse.json({ error: 'Missing partner name or tier' }, { status: 400 });
    }

    // 🔍 Attempt to find user by partnerSlug
    const user = await prisma.user.findFirst({
      where: { partnerSlug: partnerName },
      select: { id: true },
    });

    // Assign fallback userId if user not found (e.g. open/public API)
    const userId = user?.id || 'public-api';

    // 🧾 Build token payload
    const payload = {
      userId,
      partner: partnerName,
      tier,
      docs,
      iat: Math.floor(Date.now() / 1000),
    };

    const token = await signToken(payload); // ✅ Use correct function name

    const onboardingUrl = `https://axpt.io/onboard?token=${token}`;

    // Optional: store log if model becomes available
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