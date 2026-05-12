import { buildOrganismSnapshot } from "@/engines/runtime/server/organismSnapshotBuilder"

export async function GET() {
  const snapshot = buildOrganismSnapshot()
  return Response.json(snapshot)
}