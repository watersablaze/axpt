import { Worker } from "bullmq"
import IORedis from "ioredis"
import { prisma } from "@/lib/prisma"
import { executionEngine } from "@/engines/execution/AXPTExecutionEngine"
import {
  lockEscrowOnChain,
  releaseEscrowOnChain,
} from "@/engines/execution/chain/axgEscrowClient"

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

function asBytes32(input: string): `0x${string}` {
  return `0x${Buffer.from(input).toString("hex").slice(0, 64)}`
}

export const executionWorker = new Worker(
  "axpt-execution",

  async (job) => {
    const { intentId } = job.data

    // ─────────────────────────────
    // 1. LOAD SOURCE OF TRUTH
    // ─────────────────────────────
    const intent = await prisma.executionIntent.findUniqueOrThrow({
      where: { id: intentId },
    })

    if (intent.status !== "QUEUED") return

    await prisma.executionIntent.update({
      where: { id: intent.id },
      data: { status: "PROCESSING" },
    })

    // ─────────────────────────────
    // 2. ENGINE DECISION LAYER
    // ─────────────────────────────
    const decision = await executionEngine.execute(intent as any)

    // ─────────────────────────────
    // 3. ROUTE TO CHAIN
    // ─────────────────────────────
    let receipt: any

    if (intent.type === "LOCK_ESCROW") {
      receipt = await lockEscrowOnChain({
        caseId: asBytes32(intent.idempotencyKey),
        from: intent.payload.from,
        to: intent.payload.to,
        amount: BigInt(intent.payload.amountBaseUnits),
      })
    }

    if (intent.type === "RELEASE_ESCROW") {
      receipt = await releaseEscrowOnChain({
        caseId: asBytes32(intent.idempotencyKey),
      })
    }

    if (!receipt) {
      throw new Error("UNSUPPORTED_EXECUTION_TYPE")
    }

    // ─────────────────────────────
    // 4. PERSIST TRUTH
    // ─────────────────────────────
    await prisma.executionIntent.update({
      where: { id: intent.id },
      data: {
        status: "SUBMITTED",
        txHash: receipt.transactionHash,
      },
    })

    return receipt.transactionHash
  },

  { connection }
)
