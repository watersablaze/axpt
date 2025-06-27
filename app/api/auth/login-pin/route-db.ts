// ✅ FILE: app/api/auth/login-pin/route-db.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSessionCookieHeader } from '@/lib/auth/session';

export async function POST(req: Request) {
  const { pin } = await req.json();

  if (!pin || pin.length !== 6) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
  }

  const user = await prisma.user.findFirst(); // ✅ consider adding filter

  if (!user || !user.password) {
    return NextResponse.json({ error: 'No user or password found' }, { status: 404 });
  }

  const valid = await bcrypt.compare(pin, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true, redirectTo: '/account/dashboard' });
  res.headers.set('Set-Cookie', getSessionCookieHeader(user.id));
  return res;
}