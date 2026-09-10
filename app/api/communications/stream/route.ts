import { prisma } from "@/infrastructure/db/prisma"

import { getPrincipal } from "@/domains/auth/getPrincipal"
import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"

import { loadCommunicationRealtimeSignalsWithClient } from "@/domains/communications/realtime/loadCommunicationRealtimeSignalsWithClient"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const POLL_INTERVAL_MS = 1500
const ERROR_RETRY_MS = 4000
const HEARTBEAT_INTERVAL_MS = 15_000

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function GET(
  request: Request
) {
  const principal =
    await getPrincipal()

  if (!principal) {
    return Response.json(
      {
        error:
          "COMMUNICATIONS_AUTHENTICATION_REQUIRED",
      },
      {
        status: 401,
      }
    )
  }

  const decision =
    authorityKernel.authorize(
      principal,
      PERMISSIONS.COMMUNICATIONS_ACCESS
    )

  if (!decision.allowed) {
    return Response.json(
      {
        error:
          decision.reason,
      },
      {
        status: 403,
      }
    )
  }

  const encoder =
    new TextEncoder()

  const abortSignal =
    request.signal

  const stream =
    new ReadableStream({
      async start(controller) {
        let active = true

        /*
         * Startup overlap protects against an event
         * committed immediately before connection.
         */
        let cursor =
          new Date(
            Date.now() - 3000
          )

        const deliveredEventIds =
          new Set<string>()

        let lastHeartbeatAt =
          Date.now()

        const closeStream = () => {
          active = false

          try {
            controller.close()
          } catch {
            // Already closed.
          }
        }

        abortSignal.addEventListener(
          "abort",
          closeStream
        )

        while (
          active &&
          !abortSignal.aborted
        ) {
          try {
            /*
             * The application core re-resolves
             * membership every poll.
             */
            const records =
              await loadCommunicationRealtimeSignalsWithClient({
                client:
                  prisma,

                principal,

                since:
                  cursor,

                limit:
                  100,
              })

            for (
              const record of records
            ) {
              if (
                !active ||
                abortSignal.aborted
              ) {
                break
              }

              if (
                deliveredEventIds.has(
                  record.signal.id
                )
              ) {
                continue
              }

              deliveredEventIds.add(
                record.signal.id
              )

              if (
                record.occurredAt >
                cursor
              ) {
                cursor =
                  record.occurredAt
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(
                    record.signal
                  )}\n\n`
                )
              )
            }

            const now =
              Date.now()

            if (
              now -
                lastHeartbeatAt >=
              HEARTBEAT_INTERVAL_MS
            ) {
              controller.enqueue(
                encoder.encode(
                  `: heartbeat ${now}\n\n`
                )
              )

              lastHeartbeatAt =
                now
            }
          } catch (error) {
            if (
              !active ||
              abortSignal.aborted
            ) {
              break
            }

            console.error(
              "[communications/stream] polling failed",
              error
            )

            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  message:
                    "COMMUNICATIONS_STREAM_ERROR",
                })}\n\n`
              )
            )

            await sleep(
              ERROR_RETRY_MS
            )

            continue
          }

          await sleep(
            POLL_INTERVAL_MS
          )
        }

        abortSignal.removeEventListener(
          "abort",
          closeStream
        )

        closeStream()
      },

      cancel() {
        // Abort signal / active guard closes loop.
      },
    })

  return new Response(
    stream,
    {
      headers: {
        "Content-Type":
          "text/event-stream",

        "Cache-Control":
          "no-cache, no-transform",

        Connection:
          "keep-alive",

        "X-Accel-Buffering":
          "no",
      },
    }
  )
}
