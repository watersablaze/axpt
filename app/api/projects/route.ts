// app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { ProjectCreateSchema } from '@/lib/validation/project';
import { ProjectStatus } from '@/lib/projects/constants';

export async function GET() {
  try {
    const { userId } = await requireResidentServer();
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, requestedAxg: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, projects });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireResidentServer();
    const raw = await req.json().catch(() => ({}));
    const { title, summary, requestedAxg } = ProjectCreateSchema.parse(raw);

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        summary,
        requestedAxg, // Prisma Decimal column accepts number; Prisma coerces
        status: ProjectStatus.SUBMITTED,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: project.id });
  } catch (e: any) {
    // If validation fails, this will still hit here—feel free to switch to 400 if you prefer
    return NextResponse.json({ ok: false, error: e.message || 'Error' }, { status: 500 });
  }
}