import crypto from "crypto"
import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"

export class ExecutionContractValidator {

  validate(snapshot: any) {
    const errors: string[] = []

    // 1. snapshot must exist
    if (!snapshot) {
      errors.push("MISSING_SNAPSHOT")
    }

    // 2. required fields
    if (typeof snapshot?.timestamp !== "number") {
      errors.push("INVALID_TIMESTAMP")
    }

    if (snapshot?.drift == null) {
      errors.push("MISSING_DRIFT")
    }

    if (snapshot?.intensity == null) {
      errors.push("MISSING_INTENSITY")
    }

    // 3. governance sanity check
    if (snapshot?.riskLevel === "CRITICAL" && snapshot?.decisionPressure < 0) {
      errors.push("INVALID_RISK_STATE")
    }

    // 4. trace integrity hint (future proofing)
    if (snapshot?.timestamp > Date.now() + 1000) {
      errors.push("FUTURE_TIMESTAMP_DETECTED")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  validateEvent(event: any) {
  const errors: string[] = []

  if (!event?.type) errors.push("MISSING_EVENT_TYPE")
  if (!event?.timestamp) errors.push("MISSING_EVENT_TIMESTAMP")

  if (event.amount && typeof event.amount !== "number") {
    errors.push("INVALID_AMOUNT_TYPE")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

  assert(snapshot: any) {
    const result = this.validate(snapshot)

    if (!result.valid) {
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "CONTRACT_VIOLATION",
        payload: snapshot,
        result: result.errors,
      })

      throw new Error(
        `[EXECUTION CONTRACT VIOLATION] ${result.errors.join(", ")}`
      )
    }
  }
}

export const executionContractValidator = new ExecutionContractValidator()
