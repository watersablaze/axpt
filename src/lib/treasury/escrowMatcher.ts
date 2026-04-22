import { prisma } from "@/lib/prisma"
import type { TransferRecord } from "./transfers"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"

export async function matchTransferToEscrow(
  walletId: string,
  tx: TransferRecord
) {
  // 🔍 find active escrow cases
  const activeCases = await prisma.caseReadModel.findMany({
    where: {
      status: {
        in: ["ESCROW_PENDING", "ESCROW_INITIATED"],
      },
    },
  })

  for (const c of activeCases) {
    const expectedAmount = Number(c.expectedAmount ?? 0)
    const received = Number(tx.amount)

    if (received === expectedAmount) {
      await appendDomainEvent({
        streamType: "CASE",
        streamId: c.id,
        eventType: EventTypes.ESCROW_FUNDED,
        payload: {
          txHash: tx.txHash,
          amount: tx.amount,
          walletId,
        },
      })
      return
    }

    if (received < expectedAmount) {
      await appendDomainEvent({
        streamType: "CASE",
        streamId: c.id,
        eventType: EventTypes.ESCROW_PARTIALLY_FUNDED, // ✅ FIXED
        payload: {
          txHash: tx.txHash,
          amount: tx.amount,
          walletId,
        },
      })
      return
    }

    if (received > expectedAmount) {
      await appendDomainEvent({
        streamType: "CASE",
        streamId: c.id,
        eventType: EventTypes.ESCROW_MISMATCH, // ✅ FIXED
        payload: {
          txHash: tx.txHash,
          amount: tx.amount,
          walletId,
        },
      })
      return
    }
  }
}