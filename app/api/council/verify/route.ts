import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { key } = await req.json();

  if (!key) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (key !== process.env.COUNCIL_MASTER_KEY) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Create signed token
    const signature = crypto
    .createHmac('sha256', process.env.COUNCIL_SESSION_SECRET!)
    .update(process.env.COUNCIL_MASTER_KEY!)
    .digest('hex');

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: 'council_session',
    value: signature,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return response;
}