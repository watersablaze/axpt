// app/api/users/set-password/handler.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSessionFromCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const cookies = req.headers.get('cookie');
  const session = getSessionFromCookie(cookies);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { password } = await req.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password too short' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hash },
  });

  // Log the password update event
  await prisma.sessionActionLog.create({
    data: {
      userId: session.userId,
      action: 'PasswordSet',
      ip: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    },
  });

  return NextResponse.json({ success: true });
}