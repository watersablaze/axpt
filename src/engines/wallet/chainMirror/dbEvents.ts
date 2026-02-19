import { prisma } from '@/lib/prisma'
import { decodeEventLog } from 'viem'
import MirrorBridgeAbi from '../../../../abi/MirrorBridge.json'

export async function persistLogs(opts: {
  network: string
  contract: string
  logs: Array<{
    blockNumber: bigint
    blockHash?: `0x${string}` | null
    transactionHash: `0x${string}`
    logIndex: number
    topics: readonly `0x${string}`[]
    data: `0x${string}`
  }>
}) {
  const { network, contract, logs } = opts
  if (!logs.length) return { inserted: 0 }

  const rows = []

  for (const l of logs) {
    try {
      const decoded = decodeEventLog({
        abi: MirrorBridgeAbi as any,
        eventName: 'MirrorTransfer',
        // decodeEventLog expects a mutable tuple; cast our readonly topics
        topics: [...l.topics] as [`0x${string}`, ...`0x${string}`[]],
        data: l.data,
      })

      const {
        idempotencyKey,
        walletEventId,
        tokenType,
        from,
        to,
        amount,
      } = decoded.args as any

      rows.push({
        network,
        contract,

        txHash: l.transactionHash,
        logIndex: l.logIndex,

        blockNumber: Number(l.blockNumber),
        blockHash: l.blockHash ?? null,

        idempotencyKey,
        walletEventId,
        tokenType,
        fromAddress: from,
        toAddress: to,
        amount: amount.toString(),

        raw: {
          blockNumber: l.blockNumber.toString(),
          transactionHash: l.transactionHash,
          topics: [...l.topics],
          data: l.data,
        },
      })
    } catch (err) {
      console.warn('[ChainMirror] failed to decode log', err)
    }
  }

  if (!rows.length) return { inserted: 0 }

  const res = await prisma.chainMirrorEvent.createMany({
    data: rows,
    skipDuplicates: true,
  })

  return { inserted: res.count }
}
