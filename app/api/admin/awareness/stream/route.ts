import { NextResponse } from "next/server"

export const runtime = "nodejs"

async function getAwarenessSnapshot() {
  const [systemRes, globalRes] = await Promise.all([
    fetch("http://localhost:3000/api/admin/system-awareness", {
      cache: "no-store",
    }),
    fetch("http://localhost:3000/api/admin/global-awareness", {
      cache: "no-store",
    }),
  ])

  const systemJson = await systemRes.json()
  const globalJson = await globalRes.json()

  return {
    items: systemJson.items || [],
    global: globalJson,
    emittedAt: Date.now(),
  }
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let active = true

      async function push() {
        try {
          const snapshot = await getAwarenessSnapshot()

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
          )
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                message: "STREAM_ERROR",
              })}\n\n`
            )
          )
        }

        if (active) {
          setTimeout(push, 3000) // 🔥 stream cadence
        }
      }

      push()

      return () => {
        active = false
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}