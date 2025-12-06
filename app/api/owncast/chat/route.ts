import { NextResponse } from 'next/server';
import { withTimeout } from '@/lib/utils/withTimeout';

export async function GET() {
  const base = process.env.OWNCAST_URL;
  if (!base) return NextResponse.json([]);

  try {
    const res = await withTimeout(fetch(`${base}/api/chat`), 4000);
    if (!res.ok) return NextResponse.json([]);

    const json = await res.json();

    return NextResponse.json(
      json.map((m: any) => ({
        id: m.id ?? crypto.randomUUID(),
        user: m.user ?? 'Unknown',
        message: m.message ?? '',
        timestamp: m.timestamp ?? new Date().toISOString(),
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}