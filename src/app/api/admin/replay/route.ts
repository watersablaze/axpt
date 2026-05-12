import { executionReplayEngine } from "@/engines/replay/ExecutionReplayEngine"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)

  const filter = (searchParams.get("filter") as any) || "ALL"
  const timestamp = searchParams.get("timestamp")

  if (timestamp) {
    return Response.json(
      executionReplayEngine.replayAt(Number(timestamp))
    )
  }

  return Response.json(
    executionReplayEngine.getTimeline(filter)
  )
}