import { NextResponse } from "next/server"
import { createCase } from "@/domains/cases/services/createCase"
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function POST(req: Request) {
  const health = await requireSystemHealthy()
  if (!health.allowed) {
    return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
  }

  const body = await req.json()

  const caseRecord = await createCase(body)

  return NextResponse.json({
    ok: true,
    caseId: caseRecord.id
  })

}
