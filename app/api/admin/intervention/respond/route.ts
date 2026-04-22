import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { caseId, decision } = await req.json()

  await prisma.interventionDecision.create({
    data: {
      caseId,
      decision,
    },
  })

  return NextResponse.json({ success: true })
}