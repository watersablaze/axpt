// app/api/save-profile/handler.ts
import { NextResponse } from 'next/server';

export async function handler(req: Request) {
  const { token, name } = await req.json();

  if (!token || !name) {
    return NextResponse.json({ error: 'Missing token or name' }, { status: 400 });
  }

  const lambdaRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api-lambda/save-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, name }),
  });

  const json = await lambdaRes.json();
  return NextResponse.json(json, { status: lambdaRes.status });
}