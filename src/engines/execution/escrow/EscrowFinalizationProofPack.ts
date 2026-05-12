import crypto from "crypto"

export type EscrowFinalizationProofPack = {
  escrowId: string

  version: string

  timestamp: number

  intent: any
  replay: any
  chainState: any
  divergence: any
  snapshot: any
  governance: any

  hashes: {
    intentHash: string
    replayHash: string
    chainHash: string
    snapshotHash: string
  }

  finalStatus:
    | "FINALIZED"
    | "BLOCKED_DIVERGENCE"
    | "REJECTED_GOVERNANCE"
}

function hash(obj: any) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex")
}

export class EscrowFinalizationProofPackBuilder {
  build(input: {
    escrowId: string
    intent: any
    replay: any
    chainState: any
    divergence: any
    snapshot: any
    governance: any
  }): EscrowFinalizationProofPack {

    const {
      escrowId,
      intent,
      replay,
      chainState,
      divergence,
      snapshot,
      governance,
    } = input

    const intentHash = hash(intent)
    const replayHash = hash(replay)
    const chainHash = hash(chainState)
    const snapshotHash = hash(snapshot)

    let finalStatus: EscrowFinalizationProofPack["finalStatus"] = "FINALIZED"

    if (divergence?.severity === "CRITICAL") {
      finalStatus = "BLOCKED_DIVERGENCE"
    }

    if (governance && !governance.allowed) {
      finalStatus = "REJECTED_GOVERNANCE"
    }

    return {
      escrowId,
      version: "1.0.0",
      timestamp: Date.now(),

      intent,
      replay,
      chainState,
      divergence,
      snapshot,
      governance,

      hashes: {
        intentHash,
        replayHash,
        chainHash,
        snapshotHash,
      },

      finalStatus,
    }
  }
}