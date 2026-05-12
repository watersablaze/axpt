import { organismSnapshotStore, reconciliationEngine } from "@/engines/runtime/serverSingletons"
import { mapChainEventToOrganism } from "./mapping/organismEventMapper"

/**
 * 🔗 AXPT EVENT INGESTION ENGINE
 * Converts blockchain events → organism cognition
 */
export class AXPTEventIngestionEngine {

  /**
   * 📥 MAIN ENTRYPOINT
   */
  async ingest(event: any) {

    // ──────────────────────────────
    // 1. NORMALIZE EVENT
    // ──────────────────────────────
    const normalized = this.normalize(event)

    // ──────────────────────────────
    // 2. MAP TO ORGANISM SIGNAL
    // ──────────────────────────────
    const organismSignal = mapChainEventToOrganism(normalized)

    // ──────────────────────────────
    // 3. UPDATE RECONCILIATION LAYER
    // ──────────────────────────────
    await reconciliationEngine.flagAnomaly({
      userId: normalized.from ?? "system",
      reason: normalized.type,
    })

    // ──────────────────────────────
    // 4. STORE IMMUTABLE EVENT SNAPSHOT
    // ──────────────────────────────
    organismSnapshotStore.storeDerived({
      source: "CHAIN_EVENT",
      caseId: normalized.caseId ?? "unknown",
      state: organismSignal,
    })

    // ──────────────────────────────
    // 5. FEEDBACK INTO ORGANISM (FUTURE HOOK)
    // ──────────────────────────────
    this.feedOrganismSignal(organismSignal)

    return organismSignal
  }

  /**
   * 🧠 NORMALIZATION LAYER
   */
  private normalize(event: any) {
    return {
      type: event.type,
      caseId: event.data?.args?.caseId,
      from: event.data?.args?.from,
      to: event.data?.args?.to,
      amount: event.data?.args?.amount,
      blockNumber: event.data?.blockNumber,
      txHash: event.data?.transactionHash,
    }
  }

  /**
   * 🧠 ORGANISM FEEDBACK HOOK
   */
  private feedOrganismSignal(signal: any) {
    // reserved for:
    // - drift correction
    // - liquidity updates
    // - risk recalibration
    // - execution confidence tuning
  }
}

/**
 * 🧬 SINGLETON
 */
export const eventIngestionEngine = new AXPTEventIngestionEngine()
