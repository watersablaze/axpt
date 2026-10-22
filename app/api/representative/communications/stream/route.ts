import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  loadCommunicationRealtimeSignalsForMemberWithClient,
} from "@/domains/communications/realtime/loadCommunicationRealtimeSignalsWithClient";

import {
  loadCommunicationReflectionRealtimeSignalsForMemberWithClient,
} from "@/domains/communications/realtime/loadCommunicationReflectionRealtimeSignalsWithClient";

import {
  resolveRepresentativeFieldRealtimeScopeWithClient,
} from "@/domains/instruments/representative-program/communications/representativeFieldCommunications";

import {
  prisma,
} from "@/infrastructure/db/prisma";

export const dynamic =
  "force-dynamic";

export const runtime =
  "nodejs";

const POLL_INTERVAL_MS =
  1500;

const ERROR_RETRY_MS =
  4000;

const HEARTBEAT_INTERVAL_MS =
  15_000;

function sleep(
  ms: number,
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        ms,
      );
    },
  );
}

export async function GET(
  request: Request,
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return Response.json(
      {
        error:
          "REPRESENTATIVE_AUTHENTICATION_REQUIRED",
      },
      {
        status: 401,
      },
    );
  }

  /*
   * Fail closed before opening the stream.
   *
   * The same Field scope is resolved again
   * on every polling cycle below.
   */
  try {
    await resolveRepresentativeFieldRealtimeScopeWithClient({
      client:
        prisma,
      userId:
        principal.userId,
    });
  } catch {
    return Response.json(
      {
        error:
          "REPRESENTATIVE_FIELD_STREAM_UNAVAILABLE",
      },
      {
        status: 404,
      },
    );
  }

  const encoder =
    new TextEncoder();

  const abortSignal =
    request.signal;

  const stream =
    new ReadableStream({
      async start(
        controller,
      ) {
        let active =
          true;

        let communicationEventCursor =
          new Date(
            Date.now() -
              3000,
          );

        let reflectionCursor =
          new Date(
            Date.now() -
              3000,
          );

        const deliveredEventIds =
          new Set<string>();

        const deliveredReflectionIds =
          new Set<string>();

        let lastHeartbeatAt =
          Date.now();

        const closeStream =
          () => {
            active =
              false;

            try {
              controller.close();
            } catch {
              // Already closed.
            }
          };

        abortSignal.addEventListener(
          "abort",
          closeStream,
        );

        while (
          active &&
          !abortSignal.aborted
        ) {
          try {
            /*
             * Re-resolve the representative's
             * canonical Field scope every poll.
             *
             * This keeps participant standing,
             * room topology, ACTIVE status, and
             * membership authoritative while the
             * SSE connection remains open.
             */
            const scope =
              await resolveRepresentativeFieldRealtimeScopeWithClient({
                client:
                  prisma,
                userId:
                  principal.userId,
              });

            const conversationIds =
              [
                scope.conversationId,
              ] as const;

            const [
              communicationRecords,
              reflectionRecords,
            ] =
              await Promise.all([
                loadCommunicationRealtimeSignalsForMemberWithClient({
                  client:
                    prisma,
                  userId:
                    principal.userId,
                  since:
                    communicationEventCursor,
                  limit:
                    100,
                  conversationIds,
                }),

                loadCommunicationReflectionRealtimeSignalsForMemberWithClient({
                  client:
                    prisma,
                  userId:
                    principal.userId,
                  since:
                    reflectionCursor,
                  limit:
                    100,
                  conversationIds,
                }),
              ]);

            for (
              const record
              of communicationRecords
            ) {
              if (
                !active ||
                abortSignal.aborted
              ) {
                break;
              }

              if (
                deliveredEventIds.has(
                  record.signal.id,
                )
              ) {
                continue;
              }

              deliveredEventIds.add(
                record.signal.id,
              );

              if (
                record.occurredAt >
                communicationEventCursor
              ) {
                communicationEventCursor =
                  record.occurredAt;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(
                    record.signal,
                  )}\n\n`,
                ),
              );
            }

            for (
              const record
              of reflectionRecords
            ) {
              if (
                !active ||
                abortSignal.aborted
              ) {
                break;
              }

              if (
                deliveredReflectionIds.has(
                  record.signal.id,
                )
              ) {
                continue;
              }

              deliveredReflectionIds.add(
                record.signal.id,
              );

              if (
                record.createdAt >
                reflectionCursor
              ) {
                reflectionCursor =
                  record.createdAt;
              }

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(
                    record.signal,
                  )}\n\n`,
                ),
              );
            }

            const now =
              Date.now();

            if (
              now -
                lastHeartbeatAt >=
              HEARTBEAT_INTERVAL_MS
            ) {
              controller.enqueue(
                encoder.encode(
                  `: heartbeat ${now}\n\n`,
                ),
              );

              lastHeartbeatAt =
                now;
            }
          } catch (error) {
            if (
              !active ||
              abortSignal.aborted
            ) {
              break;
            }

            console.error(
              "[representative/communications/stream] polling failed",
              error,
            );

            /*
             * Do not leak internal Field topology
             * or authority state through SSE.
             */
            controller.enqueue(
              encoder.encode(
                `event: error\ndata: ${JSON.stringify({
                  message:
                    "REPRESENTATIVE_FIELD_STREAM_ERROR",
                })}\n\n`,
              ),
            );

            await sleep(
              ERROR_RETRY_MS,
            );

            continue;
          }

          await sleep(
            POLL_INTERVAL_MS,
          );
        }

        abortSignal.removeEventListener(
          "abort",
          closeStream,
        );

        closeStream();
      },

      cancel() {
        // Abort signal / active guard closes loop.
      },
    });

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
    },
  );
}
