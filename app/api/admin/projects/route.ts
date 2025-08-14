// app/api/admin/projects/route.ts (GET: list all for review)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function GET() {
  try {
    await requireElderServer();
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:true, title:true, status:true, requestedAxg:true, createdAt:true,
        user: { select: { email:true, name:true } }
      },
    });
    return NextResponse.json({ ok: true, projects });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message || 'Forbidden' }, { status: 403 });
  }
}