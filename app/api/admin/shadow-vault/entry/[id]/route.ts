// 📁 app/api/admin/shadow-vault/entry/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'Missing ID param' }, { status: 400 });
    }

    const entry = await prisma.gemIntake.findUnique({
      where: { id: params.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (err) {
    console.error('[❌ ERROR - FETCH ENTRY]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: 'Missing ID param' }, { status: 400 });
    }

    await prisma.gemIntake.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[❌ DELETE ENTRY ERROR]', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}