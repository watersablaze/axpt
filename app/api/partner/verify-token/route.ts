// /app/api/verify-token/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';

const TOKEN_SECRET = process.env.TOKEN_SECRET!;

export async function POST(req: Request) {
  const { email, token } = await req.json();

  if (!email || !token) {
    return NextResponse.json({ success: false, message: 'Missing email or token.' }, { status: 400 });
  }

  const generatedToken = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(email)
    .digest('hex');

  if (generatedToken === token) {
    return NextResponse.json({ success: true, message: 'Token is valid.' });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid token.' }, { status: 401 });
  }
}