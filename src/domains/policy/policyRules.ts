import { PolicyContext } from "./policyTypes"

export function evaluatePolicy(ctx: PolicyContext): boolean {

  const { role, gateType, action } = ctx

  if (action === "COMPLETE_GATE") {

    switch (gateType) {

      case "ARTIFACT_REQUIRED":
        return role === "PARTNER" || role === "VERIFIER"

      case "SIGNATURE_REQUIRED":
        return role === "SIGNATORY"

      case "ESCROW_LOCK":
        return role === "TREASURY"

      case "ORACLE_CHECK":
        return role === "SYSTEM"

      default:
        return role === "ADMIN"
    }
  }

  return false
}