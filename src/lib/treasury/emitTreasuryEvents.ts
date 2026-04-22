import { prisma } from "@/lib/prisma"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import type { TransferRecord } from "./transfers"

export async function emitTransferEvents(
  walletId: string,
  transfers: TransferRecord[]
) {
  for (const tx of transfers.slice(0, 5)) {
    // 🔒 DEDUPE CHECK
    const existing = await prisma.domainEvent.findFirst({
      where: {
        eventType: tx.direction === "in"
          ? "TREASURY_INFLOW"
          : "TREASURY_OUTFLOW",
        payload: {
          path: ["txHash"],
          equals: tx.txHash,
        },
      },
    })

    if (existing) continue

    // ✅ Emit ONLY if new
    await appendDomainEvent({
      streamType: "TREASURY",
      streamId: walletId,
      eventType:
        tx.direction === "in"
          ? "TREASURY_INFLOW"
          : "TREASURY_OUTFLOW",
      payload: {
        txHash: tx.txHash,
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
      },
    })
  }
}