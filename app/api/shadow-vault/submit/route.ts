import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // adjust to your prisma client path

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const entry = await prisma.gemIntake.create({
      data: {
        name: data.name,
        email: data.email,
        desiredGem: data.desiredGem,
        format: data.format || null,
        size: data.size || null,
        quantity: data.quantity || null,
        notes: data.notes || null,
      },
    });

    console.log('[📿 GEM INTAKE SAVED]', entry);

    return NextResponse.json({ message: 'Your entry has been saved. We’ll contact you soon.' });
  } catch (error) {
    console.error('[❌ ERROR]', error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}