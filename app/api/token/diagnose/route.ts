import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { env } from '@/lib/env/readEnv';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Missing token' }, { status: 400 });
    }

    const secret = new TextEncoder().encode(env.SIGNING_SECRET);

    const { payload, protectedHeader } = await jwtVerify(token, secret);

    return NextResponse.json({
      ok: true,
      message: 'Token successfully verified',
      header: protectedHeader,
      payload,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: 'Token verification failed',
      details: err.message ?? String(err),
    }, { status: 401 });
  }
}