// app/api/cada/waitlist/route.ts

import { NextResponse } from 'next/server';
import { sendCadaNotification } from '@/lib/email/sendCadaNotification';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      console.warn('🚫 Invalid email submitted:', email);
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const joinedAtISO = new Date().toISOString();

    console.log('📨 Sending welcome email to', email);

    await sendCadaNotification(email, joinedAtISO);

    console.log('✅ Email successfully dispatched via Resend');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error sending CADA email:', err.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}