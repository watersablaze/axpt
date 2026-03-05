import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'
import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'
import { sleep, clampToRange } from './utils'
import { getOrCreateCursor, advanceCursor } from './dbCursor'
import { persistLogs } from './dbEvents'

console.log("DB URL:", process.env.DATABASE_URL)
const MIRROR_TRANSFER_EVENT = parseAbiItem(
  'event MirrorTransfer(bytes32 idempotencyKey, bytes32 walletEventId, bytes32 tokenType, address from, address to, uint256 amount)'
)

export async function startReadOnlyChainMirror() {
  console.log('[ChainMirror:RO] starting read-only loop…')

  const env = validateChainMirrorEnv()

  const maxBlockRange = BigInt(env.maxBlocks)        // provider limit (10 on Alchemy free)
  const confirmations = BigInt(env.confirmations ?? 2)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.rpcUrl),
  })

const cursor = await getOrCreateCursor({
  chainId: env.chainId,
  network: env.network,
  contract: env.mirrorBridge,
  startBlock: BigInt(env.startBlock),
})

  let last = BigInt(cursor.lastBlock)
  let running = true

  console.log('[ChainMirror:RO] cursor lastBlock =', last.toString())

  // graceful shutdown
  process.on('SIGINT', () => {
    console.log('[ChainMirror:RO] SIGINT received — shutting down gracefully…')
    running = false
  })

  process.on('SIGTERM', () => {
    console.log('[ChainMirror:RO] SIGTERM received — shutting down gracefully…')
    running = false
  })

  while (running) {
    try {
      const latest = await publicClient.getBlockNumber()

      // safe head protects against reorgs
      const safeHead = latest > confirmations
        ? latest - confirmations
        : 0n

      const lag = safeHead - last

      console.log(
        `[ChainMirror:RO] latest=${latest} safeHead=${safeHead} cursor=${last} lag=${lag}`
      )

      if (safeHead <= last) {
        await sleep(env.pollMs)
        continue
      }

      let from = last + 1n

      while (from <= safeHead && running) {

        const remaining = safeHead - from + 1n
        const range = remaining > maxBlockRange
          ? maxBlockRange
          : remaining

        const to = from + range - 1n

        console.log(`[ChainMirror:RO] scanning ${from} → ${to}`)

        const logs = await publicClient.getLogs({
          address: env.mirrorBridge,
          event: MIRROR_TRANSFER_EVENT,
          fromBlock: from,
          toBlock: to,
        })

        const { inserted } = await persistLogs({
          network: env.network,
          contract: env.mirrorBridge,
          chainId: env.chainId,
          logs,
        })

        last = to

        await advanceCursor({
          chainId: env.chainId,
          contract: env.mirrorBridge,
          network: env.network,
          lastBlock: last,
        })

        if (logs.length || inserted) {
          console.log(
            `[ChainMirror:RO] logs=${logs.length} inserted=${inserted} newCursor=${last}`
          )
        }

        from = to + 1n
      }

      await sleep(env.pollMs)

    } catch (err: any) {

      console.error('[ChainMirror:RO] RPC ERROR')
      console.error('shortMessage:', err?.shortMessage)
      console.error('details:', err?.details)
      console.error('status:', err?.status)

      // provider aware backoff
      await sleep(Math.max(5000, env.pollMs))
    }
  }

  console.log('[ChainMirror:RO] shutdown complete.')
}