// app/api/test-email/route.ts

import { NextResponse } from 'next/server';
import { sendCadaNotification } from '@/lib/email/sendCadaNotification';

export async function GET() {
  const testEmail = 'example@domain.com';
  const joinedAtISO = new Date().toISOString();

  await sendCadaNotification(testEmail, joinedAtISO);

  return NextResponse.json({ success: true });
}