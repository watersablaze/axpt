import { decodeEventLog } from "viem"
import { axgEscrowAbi } from "@/lib/evm/contracts/axgEscrow"

import { organismSnapshotStore, reconciliationEngine } from "@/engines/runtime/serverSingletons"

/**
 * 🧠 AXPT EVENT INGESTION ENGINE
 * Chain → Organism translation layer
 */
export class AXPTEventIngestionEngine {
  /**
   * 📡 MAIN INGESTION ENTRYPOINT
   */
  async ingest(raw: {
    log: any
    txHash: string
    blockNumber: bigint
  }) {
    const parsed = this.decodeLog(raw.log)

    if (!parsed) return

    const event = this.normalize(parsed, raw)

    await this.route(event)
  }

  /**
   * 🧬 ABI DECODER
   */
  private decodeLog(log: any) {
    try {
      const decoded = decodeEventLog({
        abi: axgEscrowAbi,
        data: log.data,
        topics: log.topics,
      })

      return decoded
    } catch {
      return null
    }
  }

  /**
   * 🧠 NORMALIZATION LAYER
   */
  private normalize(decoded: any, raw: any) {
    const name = decoded.name

    switch (name) {
      case "EscrowLocked":
        return {
          type: "ESCROW_LOCKED",
          caseId: decoded.args.caseId,
          from: decoded.args.from,
          to: decoded.args.to,
          amount: decoded.args.amount,
          txHash: raw.txHash,
          blockNumber: raw.blockNumber,
        }

      case "EscrowReleased":
        return {
          type: "ESCROW_RELEASED",
          caseId: decoded.args.caseId,
          txHash: raw.txHash,
          blockNumber: raw.blockNumber,
        }

      case "EscrowDisputed":
        return {
          type: "ESCROW_DISPUTED",
          caseId: decoded.args.caseId,
          txHash: raw.txHash,
          blockNumber: raw.blockNumber,
        }

      default:
        return null
    }
  }

  /**
   * 🧭 ROUTING LAYER (ORGANISM IMPACT ENGINE)
   */
  private async route(event: any) {
    switch (event.type) {
      case "ESCROW_LOCKED":
        await this.onEscrowLocked(event)
        break

      case "ESCROW_RELEASED":
        await this.onEscrowReleased(event)
        break

      case "ESCROW_DISPUTED":
        await this.onEscrowDisputed(event)
        break
    }
  }

  /**
   * 🔒 ESCROW LOCK EVENT
   */
  private async onEscrowLocked(event: any) {
    organismSnapshotStore.storeDerived({
      source: "CHAIN_EVENT",
      caseId: event.caseId,
      state: {
        type: "ESCROW_LOCKED",
        intensity: 0.6,
        liquidityImpact: -0.2,
      },
    })

    await reconciliationEngine.reconcile(event.caseId)
  }

  /**
   * 🔓 ESCROW RELEASE EVENT
   */
  private async onEscrowReleased(event: any) {
    organismSnapshotStore.storeDerived({
      source: "CHAIN_EVENT",
      caseId: event.caseId,
      state: {
        type: "ESCROW_RELEASED",
        intensity: 0.4,
        liquidityImpact: +0.3,
      },
    })

    await reconciliationEngine.reconcile(event.caseId)
  }

  /**
   * ⚠ DISPUTE EVENT
   */
  private async onEscrowDisputed(event: any) {
    organismSnapshotStore.storeDerived({
      source: "CHAIN_EVENT",
      caseId: event.caseId,
      state: {
        type: "ESCROW_DISPUTED",
        intensity: 0.9,
        liquidityImpact: -0.5,
      },
    })

    await reconciliationEngine.reconcile(event.caseId)
  }
}

/**
 * 🧬 SINGLETON
 */
export const eventIngestionEngine = new AXPTEventIngestionEngine()
