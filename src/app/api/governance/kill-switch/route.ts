import { executionGovernance } from "@/engines/governance/ExecutionGovernanceLayer"

export async function POST(req: Request) {
  const body = await req.json()

  if (body.action === "ACTIVATE") {
    executionGovernance.activateKillSwitch(body.reason)
  }

  if (body.action === "DEACTIVATE") {
    executionGovernance.deactivateKillSwitch()
  }

  return Response.json({ ok: true })
}