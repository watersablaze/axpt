import { evaluatePolicy } from "./policyRules"
import { PolicyContext } from "./policyTypes"

export function enforcePolicy(ctx: PolicyContext) {

  const allowed = evaluatePolicy(ctx)

  if (!allowed) {
    throw new Error(
      `Policy violation: ${ctx.role} cannot perform ${ctx.action} on ${ctx.gateType}`
    )
  }

  return true
}