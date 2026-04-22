import { NextRequest } from "next/server"

const clients: WritableStreamDefaultWriter[] = []

export async function GET(req: NextRequest) {

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  clients.push(writer)

  req.signal.addEventListener("abort", () => {
    const index = clients.indexOf(writer)
    if (index !== -1) clients.splice(index, 1)
  })

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    }
  })

}

export function broadcastCaseEvent(event: any) {

  const payload = `data: ${JSON.stringify(event)}\n\n`

  for (const writer of clients) {
    writer.write(payload)
  }

}