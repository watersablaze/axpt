import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireElderServer } from '@/lib/auth/requireElderServer';

export async function POST(req: Request) {
  await requireElderServer();

  try {
    const body = await req.json();
    const { smartContractId, artist, title, medium, statement, ipfsHash, signature } = body;

    if (!smartContractId || !artist || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const proof = await prisma.culturalProof.create({
      data: {
        smartContractId,
        artist,
        title,
        medium,
        statement,
        ipfsHash,
        signature,
      },
    });

    return NextResponse.json(proof);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Failed to create cultural proof' }, { status: 500 });
  }
}

export async function GET() {
  const proofs = await prisma.culturalProof.findMany({
    include: { smartContract: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(proofs);
}