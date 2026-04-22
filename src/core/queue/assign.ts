export function assignOperator(role: string) {
  switch (role) {
    case "TREASURY":
      return "treasury_operator"

    case "VERIFIER":
      return "verification_agent"

    case "SIGNATORY":
      return "signing_authority"

    default:
      return "general_operator"
  }
}