import { NextResponse } from 'next/server';
import { fetchOwncastStatus } from '@/lib/live/fetchOwncastStatus';

export async function GET() {
  const status = await fetchOwncastStatus();
  return NextResponse.json(status);
}