import { executionMemoryLedger } from "@/engines/memory/ExecutionMemoryLedger"
import { executionEvolutionLoop } from "@/engines/evolution/ExecutionEvolutionLoop"

type BehaviorSignature = {
  riskProfile: number
  driftProfile: number
  governanceProfile: number
  finalityProfile: number
}

type TransferRecord = {
  fromEntity: string
  toEntity: string
  similarity: number
  timestamp: number
  weightDelta: {
    riskWeight: number
    driftWeight: number
    finalityWeight: number
  }
}

export class ExecutionTransferLayer {

  private transfers: TransferRecord[] = []

  /**
   * 🧠 MAIN TRANSFER FUNCTION
   */
  transfer(fromEntity: string, toEntity: string) {

    const fromMemory = executionMemoryLedger.get(fromEntity)
    const toMemory = executionMemoryLedger.get(toEntity)

    const fromSig = this.buildSignature(fromMemory)
    const toSig = this.buildSignature(toMemory)

    const similarity = this.computeSimilarity(fromSig, toSig)

    // ─────────────────────────────
    // 🧠 ONLY TRANSFER IF SYSTEMS ARE RELATED
    // ─────────────────────────────

    if (similarity < 0.65) {
      return null
    }

    const weightDelta = this.computeTransferDelta(fromSig, toSig)

   // ETK-OBSERVABLE ONLY (PHASE 2 MIGRATION)
   // executionEvolutionLoop.inject(toEntity, weightDelta)

    const record: TransferRecord = {
      fromEntity,
      toEntity,
      similarity,
      weightDelta,
      timestamp: Date.now(),
    }

    this.transfers.push(record)

    return record
  }

  /**
   * 🧠 SIGNATURE BUILDER
   */
  private buildSignature(memory: any[]): BehaviorSignature {

    const risk = this.avg(memory, "risk")
    const drift = this.avg(memory, "drift")
    const governance = this.avg(memory, "governance")
    const finality = this.avg(memory, "finality")

    return {
      riskProfile: risk,
      driftProfile: drift,
      governanceProfile: governance,
      finalityProfile: finality,
    }
  }

  /**
   * 🧠 SIMILARITY ENGINE
   */
  private computeSimilarity(a: BehaviorSignature, b: BehaviorSignature) {

    const diff =
      Math.abs(a.riskProfile - b.riskProfile) +
      Math.abs(a.driftProfile - b.driftProfile) +
      Math.abs(a.governanceProfile - b.governanceProfile) +
      Math.abs(a.finalityProfile - b.finalityProfile)

    return 1 - diff / 4
  }

  /**
   * 🧠 TRANSFER DELTA GENERATOR
   */
  private computeTransferDelta(from: BehaviorSignature, to: BehaviorSignature) {

    return {
      riskWeight: (from.riskProfile - to.riskProfile) * 0.1,
      driftWeight: (from.driftProfile - to.driftProfile) * 0.1,
      finalityWeight: (from.finalityProfile - to.finalityProfile) * 0.1,
    }
  }

  private avg(memory: any[], key: string) {
    if (!memory.length) return 0
    return memory.reduce((a, b) => a + (b.data?.[key] ?? 0), 0) / memory.length
  }

  /**
   * 🧠 READ TRANSFERS
   */
  getTransfers() {
    return this.transfers
  }
}

export const executionTransferLayer =
  new ExecutionTransferLayer()