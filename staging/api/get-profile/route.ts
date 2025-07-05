import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // ✅ FIXED

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { accessToken: token },
    select: { name: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ name: user.name });
}
