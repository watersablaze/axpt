import { proofLedger } from "./ProofLedger"
import type { ProofEventType } from "./ProofLedger"
import crypto from "crypto"

export function writeProof(entry: {
  type: ProofEventType
  payload: any
  sourceNodeId?: string
  version?: string
}) {
proofLedger.append({
  id: crypto.randomUUID(),
  type: entry.type,
  timestamp: Date.now(),
  eventHash: hash(entry.payload),
  sourceNodeId: entry.sourceNodeId ?? null,
  payload: entry.payload,
})
}

function hash(payload: any) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
}
