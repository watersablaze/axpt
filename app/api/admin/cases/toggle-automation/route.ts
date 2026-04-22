import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { caseId, enabled } = await req.json()

  await prisma.case.update({
    where: { id: caseId },
    data: {
      automationEnabled: enabled,
    },
  })

  return NextResponse.json({
    success: true,
  })
}