import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function POST() {
  try {
    const { user } = await requireElderServer();

    const saved = await prisma.initiative.upsert({
      where: { slug: 'project-protium' },
      update: {
        title: 'Project Protium',
        summary: 'Integrated hydrogen, quantum-secure storage, and decentralized finance.',
        category: 'ENERGY',
        status: 'ACTIVE',
      },
      create: {
        slug: 'project-protium',
        title: 'Project Protium',
        summary: 'Integrated hydrogen, quantum-secure storage, and decentralized finance.',
        category: 'ENERGY',
        status: 'ACTIVE',
        createdById: user.id,
      },
      select: { id: true, slug: true, title: true, status: true },
    });

    return NextResponse.json({ ok: true, item: saved });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Forbidden' }, { status: 403 });
  }
}