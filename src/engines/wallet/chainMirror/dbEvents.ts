import { prisma } from '@/lib/prisma'

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

  const rows = logs.map((l) => ({
    network,
    contract,
    blockNumber: l.blockNumber,
    blockHash: l.blockHash ?? null,
    txHash: l.transactionHash,
    logIndex: l.logIndex,
    topic0: l.topics?.[0] ?? null,
    raw: {
      blockNumber: l.blockNumber.toString(),
      blockHash: l.blockHash ?? null,
      transactionHash: l.transactionHash,
      logIndex: l.logIndex,
      topics: [...l.topics],
      data: l.data,
    },
  }))

  const res = await prisma.chainMirrorEvent.createMany({
    data: rows,
    skipDuplicates: true,
  })

  return { inserted: res.count }
}