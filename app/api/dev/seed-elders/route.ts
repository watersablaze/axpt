import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function POST() {
  const users = await prisma.user.findMany({
    take: 3,
    select: { id: true, email: true },
  })

  for (const user of users) {
    await prisma.councilElder.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  }

  return NextResponse.json({
    ok: true,
    elders: users,
  })
}