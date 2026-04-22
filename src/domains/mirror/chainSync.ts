import { prisma } from '@/infrastructure/db/prisma'
import { getMirrorEvents } from './chainReader'
import { decodeTokenType } from './encoding'
import { sendAlert } from '@/lib/system/alert'

const CHAIN_ID = 11155111
const NETWORK = 'sepolia'
const SAFE_CONFIRMATIONS = 5n

export async function syncChainEvents() {
  try {
    const state = await prisma.chainSyncState.findUnique({
      where: { id: 'mirror' }
    })

    let fromBlock = state?.lastBlock ?? 0n

    // 1. get latest block directly
    const latestBlock = (await prisma.$queryRawUnsafe(
      `SELECT max("blockNumber") FROM "ChainMirrorEvent"`
    ).catch(() => null)) as bigint | null

    // fallback: small fetch if empty DB
    const probeFromBlock = latestBlock && latestBlock > fromBlock ? latestBlock : fromBlock
    const probe = await getMirrorEvents(probeFromBlock, probeFromBlock + 1000n)
    const detectedLatest = probe.reduce(
      (max, e) => (e.blockNumber > max ? e.blockNumber : max),
      probeFromBlock
    )

    const safeToBlock =
      detectedLatest > SAFE_CONFIRMATIONS
        ? detectedLatest - SAFE_CONFIRMATIONS
        : detectedLatest

    if (safeToBlock <= fromBlock) {
      await prisma.circuitEvent.create({
        data: {
          type: 'SYNC',
          severity: 'INFO',
          message: 'Synced 0 events',
          metadata: {
            fromBlock: fromBlock.toString(),
            toBlock: fromBlock.toString(),
          },
        },
      })

      return { inserted: 0 }
    }

    // 2. fetch bounded range
    const events = await getMirrorEvents(fromBlock, safeToBlock)

    let inserted = 0
    let maxBlockSeen = fromBlock

    for (const event of events) {
      const args = event.args

      const decodedToken = decodeTokenType(String(args.tokenType))

      await prisma.chainMirrorEvent.upsert({
        where: {
          chainId_txHash_logIndex: {
            chainId: CHAIN_ID,
            txHash: event.transactionHash,
            logIndex: Number(event.logIndex)
          }
        },
        update: {},
        create: {
          network: NETWORK,
          contract: process.env.EVM_MIRROR_BRIDGE_ADDRESS!,
          chainId: CHAIN_ID,

          txHash: event.transactionHash,
          logIndex: Number(event.logIndex),

          blockNumber: event.blockNumber,
          blockHash: event.blockHash ?? null,
          chainTimestamp: null,

          idempotencyKey: args.idempotencyKey,
          walletEventId: args.walletEventId,

          tokenType: decodedToken,
          fromAddress: args.from,
          toAddress: args.to,

          amount: (args.amount ?? 0n).toString(),

          raw: {
            ...event,
            tokenTypeRaw: args.tokenType
          }
        }
      })

      inserted++

      if (event.blockNumber > maxBlockSeen) {
        maxBlockSeen = event.blockNumber
      }
    }

    await prisma.chainSyncState.upsert({
      where: { id: 'mirror' },
      update: { lastBlock: maxBlockSeen },
      create: { id: 'mirror', lastBlock: maxBlockSeen }
    })

    await prisma.circuitEvent.create({
      data: {
        type: 'SYNC',
        severity: 'INFO',
        message: `Synced ${inserted} events`,
        metadata: {
          fromBlock: fromBlock.toString(),
          toBlock: maxBlockSeen.toString(),
        },
      },
    })

    return {
      inserted,
      fromBlock,
      toBlock: maxBlockSeen
    }
  } catch (err: any) {
    await sendAlert(
      `CHAIN SYNC FAILED → ${err.message ?? 'unknown error'}`,
      'CRITICAL',
      undefined,
      {
        code: 'CHAIN_SYNC_FAILED',
        title: 'Chain sync failed',
        fingerprint: 'CHAIN_SYNC_FAILED',
        throttleMs: 300_000,
      }
    )

    throw err
  }
}
