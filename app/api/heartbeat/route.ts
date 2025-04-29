import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'AXPT Online',
    timestamp: new Date().toISOString(),
  });
}