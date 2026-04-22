import { NextResponse } from "next/server"
import { runAutomationCycle } from "@/core/automation/engine"

export async function POST() {
  try {
    const results = await runAutomationCycle()

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (err: any) {
    console.error("AUTOMATION ERROR:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}