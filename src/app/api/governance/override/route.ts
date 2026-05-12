import { executionGovernance } from "@/engines/governance/ExecutionGovernanceLayer"

export async function POST(req: Request) {
  const body = await req.json()

  executionGovernance.setHumanOverride(body.mode, body.reason)

  return Response.json({ ok: true })
}