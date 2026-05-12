import type { EscrowFinalizationProofPack } from "./EscrowFinalizationProofPack"
import { executionIntentBus } from "@/engines/execution/bus/ExecutionIntentBus"

export class OnchainEscrowCommitEngine {

  async commit(proof: EscrowFinalizationProofPack) {
    if (proof.finalStatus !== "FINALIZED") {
      throw new Error("ESCROW_NOT_ELIGIBLE_FOR_ONCHAIN_COMMIT")
    }

    const payload = this.buildTransactionPayload(proof)

    const tx = await this.broadcastToChain(payload)

    executionIntentBus.emit({
      type: "ESCROW_FINALIZE",
      escrowId: proof.escrowId,
      proofPackHash: proof.hashes.snapshotHash,
      snapshotHash: proof.hashes.snapshotHash,
      replayHash: proof.hashes.replayHash,
      severity: proof.divergence.severity,
      payload: proof,
    })

    return {
      escrowId: proof.escrowId,
      txHash: tx.hash,
      blockNumber: tx.blockNumber,
      committedAt: Date.now(),
    }
  }

  private buildTransactionPayload(proof: EscrowFinalizationProofPack) {
    return {
      escrowId: proof.escrowId,
      intentHash: proof.hashes.intentHash,
      replayHash: proof.hashes.replayHash,
      chainHash: proof.hashes.chainHash,
      snapshotHash: proof.hashes.snapshotHash,
      divergenceSeverity: proof.divergence.severity,
      finalStatus: proof.finalStatus,
    }
  }

  private async broadcastToChain(payload: any) {
    return {
      hash: "0xSIMULATED_TX_HASH",
      blockNumber: 0,
    }
  }
}

export const onchainEscrowCommitEngine = new OnchainEscrowCommitEngine()