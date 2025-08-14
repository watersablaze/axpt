// src/lib/access/projects.ts
import { prisma } from '@/lib/prisma';

export async function assertProjectOwner(projectId: string, userId: string) {
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  if (!p || p.userId !== userId) throw new Error('Not found');
}