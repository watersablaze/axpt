// app/api/admin/tokens/revoke/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    await prisma.revokedToken.create({
      data: {
        rawToken: token,
        partner: 'manual-revocation',
        tier: 'Revoked',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
}