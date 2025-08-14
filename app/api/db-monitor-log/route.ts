import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Fetch latest logs
export async function GET(req: NextRequest) {
  console.info('[API] 🌿 Fetching latest DB pulse logs...');

  try {
    const logs = await prisma.dbPulseLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('[API] ❌ Failed to fetch logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DB logs',
        details: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      },
      { status: 500 }
    );
  }
}

// Manual ping
export async function POST(req: NextRequest) {
  console.info('[API] ⚡ Manual Pulse Triggered');

  try {
    const pulse = await prisma.dbPulseLog.create({
      data: {
        status: 'healthy',
        message: 'Manual ping from dashboard fallback.',
      },
    });

    console.info('[API] ✅ Manual pulse inserted:', pulse.id);

    return NextResponse.json({ success: true, pulse });
  } catch (error) {
    console.error('[API] ❌ Error inserting manual pulse:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to insert manual pulse',
        details: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      },
      { status: 500 }
    );
  }
}