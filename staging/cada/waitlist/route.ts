import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'CADA system disabled in this build'
  });
}