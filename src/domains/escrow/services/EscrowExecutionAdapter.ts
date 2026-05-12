// src/domains/escrow/EscrowExecutionAdapter.ts

import { prisma } from "@/lib/prisma"
import { emitCaseEvent } from "@/domains/cases/events/caseEventBus"

import {
  lockOnChainEscrow,
  releaseOnChainEscrow,
} from "@/lib/evm/contracts/axgEscrow"

export class EscrowExecutionAdapter {

  /**
   * 🔒 LOCK ESCROW (OFFCHAIN + ONCHAIN)
   */
  async lock(params: {
    caseId: string
    from: `0x${string}`
    to: `0x${string}`
    amount: bigint
  }) {

    // 1. write local state first (fast UX)
    const escrow = await prisma.escrow.create({
      data: {
        caseId: params.caseId,
        status: "LOCKED",
        lockedAt: new Date(),
        amount: params.amount.toString(),
      }
    })

    // 2. trigger on-chain settlement
    const txHash = await lockOnChainEscrow(params)

    // 3. emit system event
    await emitCaseEvent({
      name: "ESCROW_LOCKED",
      payload: {
        caseId: params.caseId,
        txHash,
      },
      occurredAt: new Date().toISOString()
    })

    return { escrow, txHash }
  }

  /**
   * 🔓 RELEASE ESCROW (OFFCHAIN + ONCHAIN)
   */
  async release(caseId: string) {

    // 1. update local DB
    const escrow = await prisma.escrow.update({
      where: { caseId },
      data: {
        status: "RELEASED",
        releasedAt: new Date()
      }
    })

    // 2. execute blockchain release
    const txHash = await releaseOnChainEscrow(caseId)

    // 3. emit event
    await emitCaseEvent({
      name: "ESCROW_RELEASED",
      payload: {
        caseId,
        txHash,
      },
      occurredAt: new Date().toISOString()
    })

    return { escrow, txHash }
  }
}

export const escrowExecutionAdapter = new EscrowExecutionAdapter()