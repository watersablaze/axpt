export type AXPTRole =
  | "PARTNER"
  | "SIGNATORY"
  | "TREASURY"
  | "VERIFIER"
  | "SYSTEM"
  | "ADMIN"

export type PolicyContext = {
  role: AXPTRole
  gateType: string
  action: string
}