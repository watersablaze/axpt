// app/api/intake/axis-journey/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAxisConfirmation } from '@/lib/email/sendAxisConfirmation';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const joinedAt = new Date();

    // Store in DB
    const saved = await prisma.axisJourneySubscriber.create({
      data: { email, joinedAt },
    });

    // Send confirmation email
    await sendAxisConfirmation(email, joinedAt.toISOString());

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Handle unique constraint (already submitted)
    if (err.code === 'P2002') {
      console.warn('⚠️ Email already exists:', err.meta?.target);
      return NextResponse.json({ error: 'Email already submitted' }, { status: 409 });
    }

    console.error('❌ Axis intake error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}