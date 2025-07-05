// app/api-lambda/save-profile/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { token, name } = await req.json();

  if (!token || !name) {
    return NextResponse.json({ error: 'Missing token or name' }, { status: 400 });
  }

  const profile = await prisma.user.updateMany({
    where: { accessToken: token },
    data: { name },
  });

  if (profile.count === 0) {
    return NextResponse.json({ error: 'User not found for token' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}