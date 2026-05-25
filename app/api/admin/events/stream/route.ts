// app/api/admin/events/stream/route.ts

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const POLL_INTERVAL_MS = 2000
const ERROR_RETRY_MS = 5000

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  const abortSignal = request.signal

  const stream = new ReadableStream({
    async start(controller) {
      let active = true
      let lastTimestamp = new Date(Date.now() - 3000)

      const closeStream = () => {
        active = false

        try {
          controller.close()
        } catch {
          // stream already closed
        }
      }

      abortSignal.addEventListener("abort", closeStream)

      while (active && !abortSignal.aborted) {
        try {
          const events = await prisma.domainEvent.findMany({
            where: {
              occurredAt: {
                gt: lastTimestamp,
              },
            },
            orderBy: {
              occurredAt: "asc",
            },
            take: 20,
          })

          if (events.length > 0) {
            lastTimestamp = events[events.length - 1].occurredAt

            for (const event of events) {
              if (!active || abortSignal.aborted) break

            const payload = {
              id: event.id,
              type: event.eventType,

              streamType: event.streamType,
              streamId: event.streamId,

              occurredAt: event.occurredAt.toISOString(),
              createdAt: event.createdAt.toISOString(),

              metadata: event.metadata,
            }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
              )
            }
          }
        } catch (error) {
          if (!active || abortSignal.aborted) {
            break
          }

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                message: "EVENT_STREAM_ERROR",
              })}\n\n`
            )
          )

          console.error("[events/stream] polling failed", error)
          await sleep(ERROR_RETRY_MS)
          continue
        }

        await sleep(POLL_INTERVAL_MS)
      }

      abortSignal.removeEventListener("abort", closeStream)
      closeStream()
    },
    cancel() {
      // The loop exits via the abort signal / close guard.
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
