import { prisma } from "@/lib/prisma"
import { EXECUTION_VERSION } from "@/engines/contracts/ExecutionContracts"
import { runtimeBus } from "@/engines/runtime/serverSingletons";

export async function POST(req: Request) {
  const body = await req.json()

  // ─────────────────────────────
  // 1. STORE INTENT
  // ─────────────────────────────
  const intent = await prisma.executionIntent.create({
    data: {
      type: body.type,
      status: "QUEUED",
      idempotencyKey: body.idempotencyKey,
      payload: body.payload,
    },
  })

const event = {
  version: EXECUTION_VERSION,
  type: body.type,
  timestamp: Date.now(),
  payload: body.payload,
}

runtimeBus.emit(event)

  // ─────────────────────────────
  // 2. PUSH TO QUEUE
  // ─────────────────────────────
  await fetch(process.env.REDIS_QUEUE_URL!, {
    method: "POST",
    body: JSON.stringify({
      intentId: intent.id,
    }),
  })

  return Response.json({
    ok: true,
    intentId: intent.id,
  })
}
