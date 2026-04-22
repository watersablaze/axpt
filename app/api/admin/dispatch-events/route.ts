// app/api/admin/dispatch-events/route.ts
import { NextResponse } from "next/server"
import { dispatchDomainEvents } from "@/core/events/eventDispatcher"

export async function POST() {
  try {
    await dispatchDomainEvents()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Failed to dispatch domain events",
      },
      { status: 500 }
    )
  }
}