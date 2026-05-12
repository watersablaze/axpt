import { attachWarRoomStream } from "@/server/warroom/warroom-stream"

export function GET(req: Request) {
  const DenoRuntime = (globalThis as any).Deno

  if (!DenoRuntime?.upgradeWebSocket) {
    return new Response("WebSocket upgrade unavailable in this runtime", {
      status: 501,
    })
  }

  const { socket, response } = DenoRuntime.upgradeWebSocket(req)

  attachWarRoomStream(socket)

  return response
}
