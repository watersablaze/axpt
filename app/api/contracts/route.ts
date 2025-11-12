import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, network, description, status, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Missing contract ID' }, { status: 400 });

    const updated = await prisma.smartContract.update({
      where: { id },
      data: { name, network, description, status, isActive },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updated = await prisma.smartContract.update({
      where: { id },
      data: { isActive: false, status: 'Archived' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error archiving contract:', error);
    return NextResponse.json({ error: 'Failed to archive contract' }, { status: 500 });
  }
}