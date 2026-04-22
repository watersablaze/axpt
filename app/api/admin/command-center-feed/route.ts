// app/api/admin/command-center-feed/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [cases, notifications, events, escrows] = await Promise.all([
    prisma.caseReadModel.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.notificationReadModel.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.domainEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 20,
    }),
    prisma.escrow.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ])

  return NextResponse.json({
    cases,
    notifications,
    events,
    escrows,
  })
}