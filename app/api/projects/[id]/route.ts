// app/api/projects/[id]/route.ts  (GET: resident can view own item)
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';
import { assertProjectOwner } from '@/lib/access/projects';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await requireResidentServer();
    await assertProjectOwner(params.id, userId);
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          select: { id:true, action:true, note:true, createdAt:true, reviewer:{ select:{ name:true, email:true } } },
          orderBy: { createdAt: 'desc' },
        }
      }
    });
    return NextResponse.json({ ok: true, project });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e.message || 'Not found' }, { status: 404 });
  }
}