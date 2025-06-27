import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  const cookieJar = cookies();
  const raw = cookieJar.get('axpt_session')?.value;

  if (raw) {
    const hash = createHash('sha256').update(raw).digest('hex');
    await prisma.user.updateMany({
      where: { accessTokenHash: hash },
      data: { accessTokenHash: null, accessTokenIssuedAt: null },
    });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    'axpt_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );

  return response;
}