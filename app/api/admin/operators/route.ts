import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const operators = await prisma.operator.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      archetype: true,
    },
  })

  return NextResponse.json({ operators })
}