import { createPublicClient, createWalletClient, http, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

import { axgEscrowAbi, axgEscrowAddress } from "@/lib/evm/contracts/axgEscrow"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"

/**
 * ⚙️ AXPT VIEM EXECUTION ADAPTER
 * Production-grade on-chain execution layer
 */
export class AXPTViemExecutionAdapter {
  private publicClient
  private walletClient
  private account

  constructor() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.AXPT_RPC_URL!),
    })

    this.account = privateKeyToAccount(
      process.env.AXPT_EXECUTOR_PRIVATE_KEY as `0x${string}`
    )

    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(process.env.AXPT_RPC_URL!),
    })
  }

  /**
   * 🔒 EXECUTE ESCROW LOCK (REAL ON-CHAIN WRITE)
   */
  async executeEscrowLock(input: {
    caseId: string
    from: `0x${string}`
    to: `0x${string}`
    amountBaseUnits: bigint
    idempotencyKey: string
  }) {
    try {
      // 🧠 1. IDEMPOTENCY CHECK (QUEUE + LOCAL SAFETY)
      const existing = (executionIntentQueue as any).executedMap?.get?.(
        input.idempotencyKey
      )

      if (existing) {
        return {
          status: "SKIPPED_DUPLICATE",
          txHash: existing,
        }
      }

      // ⚙️ 2. WRITE TO CHAIN
      const txHash = await this.walletClient.writeContract({
        address: axgEscrowAddress,
        abi: axgEscrowAbi,
        functionName: "lockEscrow",
        args: [
          input.caseId as `0x${string}`,
          input.from,
          input.to,
          input.amountBaseUnits,
        ],
      })

      // 🔍 3. WAIT FOR CONFIRMATION (deterministic finality boundary)
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
      })

      // 🧠 4. RECORD EXECUTION TRACE
      this.recordExecution({
        idempotencyKey: input.idempotencyKey,
        caseId: input.caseId,
        txHash,
        status: receipt.status === "success" ? "CONFIRMED" : "FAILED",
        blockNumber: receipt.blockNumber,
      })

      return {
        status: "EXECUTED",
        txHash,
        blockNumber: receipt.blockNumber,
      }
    } catch (err: any) {
      return {
        status: "FAILED",
        error: err.message,
      }
    }
  }

  /**
   * 🔓 ESCROW RELEASE
   */
  async executeEscrowRelease(input: {
    caseId: string
    idempotencyKey: string
  }) {
    const txHash = await this.walletClient.writeContract({
      address: axgEscrowAddress,
      abi: axgEscrowAbi,
      functionName: "releaseEscrow",
      args: [input.caseId as `0x${string}`],
    })

    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash: txHash,
    })

    this.recordExecution({
      idempotencyKey: input.idempotencyKey,
      caseId: input.caseId,
      txHash,
      status: receipt.status === "success" ? "CONFIRMED" : "FAILED",
      blockNumber: receipt.blockNumber,
    })

    return {
      status: "RELEASE_EXECUTED",
      txHash,
    }
  }

  /**
   * 🧠 EXECUTION TRACE LOGGING (HOOK FOR SNAPSHOT + RECONCILIATION)
   */
  private recordExecution(entry: {
    idempotencyKey: string
    caseId: string
    txHash: `0x${string}`
    status: "CONFIRMED" | "FAILED"
    blockNumber?: bigint
  }) {
    // ⚠️ This will later plug into:
    // - AXPTEventIngestionEngine
    // - AXPTSnapshotStore
    // - ReconciliationEngine

    console.log("AXPT_EXECUTION_TRACE", entry)
  }
}

/**
 * 🧬 SINGLETON
 */
export const viemExecutionAdapter = new AXPTViemExecutionAdapter()
