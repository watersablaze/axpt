import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const proofs = await prisma.culturalProof.findMany({
    where: { smartContractId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(proofs);
}