// app/api/debug/db/route.ts
import { NextResponse } from 'next/server';

function mask(url?: string) {
  if (!url) return 'not set';
  try {
    const u = new URL(url);
    return `${u.protocol}//***:***@${u.hostname}${u.pathname}`;
  } catch {
    return '***';
  }
}

export async function GET() {
  // keep visible in dev; if you want to hide in prod uncomment below
  // if (process.env.NODE_ENV === 'production') return NextResponse.json({ ok:false }, { status: 404 });

  const raw = process.env.DATABASE_URL || '';
  let parsed: Record<string, string> = {};
  try {
    const u = new URL(raw);
    parsed = {
      protocol: u.protocol.replace(':',''),
      host: u.hostname,
      dbname: u.pathname.replace('/',''),
      params: u.search || '',
    };
  } catch {}

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    databaseUrlMasked: mask(raw),
    parsed,
  });
}