import { NextResponse } from "next/server"

export async function GET() {

  const stream = new ReadableStream({
    start(controller) {

      const interval = setInterval(() => {

        const data = JSON.stringify({
          type: "heartbeat",
          timestamp: Date.now()
        })

        controller.enqueue(
          `data: ${data}\n\n`
        )

      }, 5000)

      return () => clearInterval(interval)
    }
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  })
}