// app/api/cada/waitlist/route.ts

import { NextResponse } from 'next/server';
import { sendCadaNotification } from '@/lib/email/sendCadaNotification';

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  const joinedAtISO = new Date().toISOString();

  await sendCadaNotification(email, joinedAtISO);

  return NextResponse.json({ success: true });
}