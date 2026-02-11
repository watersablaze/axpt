import { createPublicClient, http, toEventSelector } from 'viem'
import { sepolia } from 'viem/chains'
import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'
import { sleep, clampToRange } from './utils'
import { getOrCreateCursor, advanceCursor } from './dbCursor'
import { persistLogs } from './dbEvents'

const MIRROR_TRANSFER_TOPIC = toEventSelector(
  'event MirrorTransfer(bytes32,bytes32,bytes32,address,address,uint256)'
)

export async function startReadOnlyChainMirror() {
  console.log('[ChainMirror:RO] starting read-only loop…')

  const env = validateChainMirrorEnv()
  const maxBlocks = BigInt(env.maxBlocks)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.rpcUrl),
  })

  // Cursor is our truth anchor.
  const cursor = await getOrCreateCursor({
    network: env.network,
    contract: env.mirrorBridge,
    startBlock: env.startBlock,
  })

  let last = BigInt(cursor.lastBlock)

  console.log('[ChainMirror:RO] cursor lastBlock =', last.toString())

  // Anchor to current head if startBlock is 0
  const head = await publicClient.getBlockNumber()
  if (last === 0n) {
    last = head
    await advanceCursor({ network: env.network, contract: env.mirrorBridge, lastBlock: last })
    console.log('[ChainMirror:RO] anchored at head block', head.toString())
  }

  while (true) {
    try {
      const latest = await publicClient.getBlockNumber()

      // Nothing to do
      if (last >= latest) {
        await sleep(env.pollMs)
        continue
      }

      // We scan from last+1 up to latest, bounded by provider limits
      let from = last + 1n

      while (from <= latest) {
        const bounded = clampToRange(from, latest, maxBlocks)
        const to = bounded.to

        console.log(`[ChainMirror:RO] scanning blocks ${from} → ${to}`)

        const logs = await publicClient.getLogs({
          address: env.mirrorBridge,
          fromBlock: from,
          toBlock: to,
          topics: [MIRROR_TRANSFER_TOPIC],
        })

        const { inserted } = await persistLogs({
          network: env.network,
          contract: env.mirrorBridge,
          logs,
        })

        // Advance cursor only after successful scan + persistence
        last = to
        await advanceCursor({ network: env.network, contract: env.mirrorBridge, lastBlock: last })

        if (logs.length || inserted) {
          console.log(`[ChainMirror:RO] logs=${logs.length} inserted=${inserted} cursor=${last}`)
        }

        from = to + 1n
      }

      await sleep(env.pollMs)
    } catch (err: any) {
      console.error('[ChainMirror:RO] poll error', err?.shortMessage || err)

      // Backoff so we don’t thrash rate limits / spam logs
      await sleep(Math.max(5000, env.pollMs))
    }
  }
}