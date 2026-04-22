import { NextResponse } from "next/server"
import { buildPriorityQueue } from "@/core/queue/priorityQueue"
import { getStateActions } from "@/core/queue/stateMachine"

export async function GET() {
  try {
    const queue = await buildPriorityQueue()

    const enriched = queue.map((item) => ({
      ...item,
      actions: getStateActions(item),
    })) 

    return NextResponse.json({
      items: enriched,
      count: enriched.length,
    })
  } catch (err: any) {
    console.error("QUEUE ERROR:", err)

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    )
  }
}