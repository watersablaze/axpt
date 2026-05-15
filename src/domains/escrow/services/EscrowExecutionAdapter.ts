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
    assetCode: string
    amountBaseUnits: bigint
    fromWalletId: string
    toWalletId: string
    from: `0x${string}`
    to: `0x${string}`
  }) {
    const caseId = params.caseId
    const amountBaseUnits = params.amountBaseUnits.toString()
    const assetCode = params.assetCode
    const fromWalletId = params.fromWalletId
    const toWalletId = params.toWalletId

    // 1. write local state first (fast UX)
    const escrow = await prisma.escrow.create({
      data: {
        escrowId: crypto.randomUUID(),
        caseId,
        amountBaseUnits,
        assetCode,
        fromWalletId,
        toWalletId,
        status: "INITIATED",
        chainState: "PENDING",
        reconciliationState: "UNRECONCILED",
      }
    })

    // 2. trigger on-chain settlement
    const txHash = await lockOnChainEscrow({
      caseId: params.caseId,
      from: params.from,
      to: params.to,
      amount: params.amountBaseUnits,
    })

    // 3. emit system event
    await emitCaseEvent({
      name: "ESCROW_LOCKED",
      payload: {
        caseId: params.caseId,
        metadata: { txHash },
      },
      occurredAt: new Date().toISOString()
    })

    return { escrow, txHash }
  }

  /**
   * 🔓 RELEASE ESCROW (OFFCHAIN + ONCHAIN)
   */
  async release(escrowId: string) {
    const existing = await prisma.escrow.findUnique({
      where: { id: escrowId },
    })

    if (!existing) {
      throw new Error("ESCROW_NOT_FOUND")
    }

    // 1. update local DB
    const escrow = await prisma.escrow.update({
      where: { id: existing.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date()
      }
    })

    // 2. execute blockchain release
    const txHash = await releaseOnChainEscrow(existing.caseId)

    // 3. emit event
    await emitCaseEvent({
      name: "ESCROW_RELEASED",
      payload: {
        caseId: existing.caseId,
        metadata: { txHash },
      },
      occurredAt: new Date().toISOString()
    })

    return { escrow, txHash }
  }
}

export const escrowExecutionAdapter = new EscrowExecutionAdapter()
