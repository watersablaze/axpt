// app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  await clearSessionCookie();

  return NextResponse.json({ success: true, message: 'Session cleared. Logged out.' });
}