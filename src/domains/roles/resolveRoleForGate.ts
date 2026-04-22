import { AXPTRole } from "./roles"

export function resolveRoleForGate(
  gateType: string
): AXPTRole {

  switch (gateType) {

    case "ARTIFACT_REQUIRED":
      return "PARTNER"

    case "SIGNATURE_REQUIRED":
      return "SIGNATORY"

    case "ESCROW_LOCK":
      return "TREASURY"

    case "ORACLE_CHECK":
      return "ORACLE"

    default:
      return "VERIFIER"
  }

}