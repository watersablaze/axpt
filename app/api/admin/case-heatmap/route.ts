import { NextResponse } from "next/server"
import { getCaseHeatmap } from "@/domains/cases/analytics/getCaseHeatmap"

export async function GET() {

  const heatmap = await getCaseHeatmap()

  return NextResponse.json(heatmap)
}