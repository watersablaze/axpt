export type OperatorDecision = "APPROVE" | "DELAY" | "OVERRIDE"

export type Operator = {
  operatorId: string
  name: string
  archetype: "EXECUTE" | "VERIFY" | "PROTECT"
  decision?: OperatorDecision
  trustScore?: number
}