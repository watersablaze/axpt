// app/api/users/set-secret/handler.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const cookiesHeader = req.headers.get('cookie');
  const session = getSessionFromCookie(cookiesHeader);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { password, pin } = await req.json();

  if (!password && !pin) {
    return NextResponse.json({ error: 'No secret provided' }, { status: 400 });
  }

  const secret = password || pin;
  if (password && password.length < 6) {
    return NextResponse.json({ error: 'Password too short (min 6)' }, { status: 400 });
  }

  if (pin && !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });
  }

  const hashed = await bcrypt.hash(secret, 10);

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      password: hashed,
    },
  });

  return NextResponse.json({ success: true });
}