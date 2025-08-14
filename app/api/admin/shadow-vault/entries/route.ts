import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const entries = await prisma.gemIntake.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true, // ✅ crucial for frontend validation
      entries,
    });
  } catch (error) {
    console.error('[❌ SHADOW VAULT API ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}