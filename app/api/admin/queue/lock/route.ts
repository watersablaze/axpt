import { NextResponse } from "next/server"
import { acquireLock } from "@/core/queue/lock"

export async function POST(req: Request) {
  const { caseId, operatorId } = await req.json()

  const result = await acquireLock(caseId, operatorId)

  return NextResponse.json(result)
}