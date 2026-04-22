import { NextResponse } from "next/server"
import { getTreasurySnapshot } from "@/lib/treasury/monitor"

export async function GET() {
  try {
    const snapshot = await getTreasurySnapshot()

    return NextResponse.json(snapshot)
  } catch (err: any) {
    console.error("Treasury snapshot error:", err)

    return NextResponse.json(
      { error: "Failed to fetch treasury snapshot" },
      { status: 500 }
    )
  }
}