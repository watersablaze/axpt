import { NextResponse } from "next/server"
import { createGoldSpaCase } from "@/core/cases/createGoldSpaCase"
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function POST() {
  try {
    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
    }

    const c = await createGoldSpaCase()

    return NextResponse.json({
      success: true,
      caseId: c.id,
    })
  } catch (err: any) {
    console.error("CREATE GOLD SPA ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Failed to create case" },
      { status: 500 }
    )
  }
}
