import { createPublicClient, http, parseAbiItem } from 'viem'
import { sepolia } from 'viem/chains'
import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'
import { sleep, clampToRange } from './utils'
import { getOrCreateCursor, advanceCursor } from './dbCursor'
import { persistLogs } from './dbEvents'

const MIRROR_TRANSFER_EVENT = parseAbiItem(
  'event MirrorTransfer(bytes32 idempotencyKey, bytes32 walletEventId, bytes32 tokenType, address from, address to, uint256 amount)'
)

export async function startReadOnlyChainMirror() {
  console.log('[ChainMirror:RO] starting read-only loop…')

  const env = validateChainMirrorEnv()
  const maxBlocks = BigInt(env.maxBlocks)

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.rpcUrl),
  })

  // ─────────────────────────────────────────────
  // Cursor anchor
  // ─────────────────────────────────────────────
  const cursor = await getOrCreateCursor({
    network: env.network,
    contract: env.mirrorBridge,
    startBlock: BigInt(env.startBlock),
  })

  let last = BigInt(cursor.lastBlock)
  console.log('[ChainMirror:RO] cursor lastBlock =', last.toString())

  const head = await publicClient.getBlockNumber()

  if (last === 0n) {
    last = head
    await advanceCursor({
      network: env.network,
      contract: env.mirrorBridge,
      lastBlock: last,
    })
    console.log('[ChainMirror:RO] anchored at head block', head.toString())
  }

  // ─────────────────────────────────────────────
  // Main loop
  // ─────────────────────────────────────────────
  while (true) {
    try {
      const latest = await publicClient.getBlockNumber()

      const lag = latest - last
      console.log(
        `[ChainMirror:RO] head=${latest} cursor=${last} lag=${lag}`
      )

      if (last >= latest) {
        await sleep(env.pollMs)
        continue
      }

      let from = last + 1n

      while (from <= latest) {
        const { to } = clampToRange(from, latest, maxBlocks)

        console.log(`[ChainMirror:RO] scanning blocks ${from} → ${to}`)

        const logs = await publicClient.getLogs({
          address: env.mirrorBridge,
          event: MIRROR_TRANSFER_EVENT,
          fromBlock: from,
          toBlock: to,
        })

      const { inserted } = await persistLogs({
        network: env.network,
        contract: env.mirrorBridge,
        logs,
      })

      last = to

        await advanceCursor({
          network: env.network,
          contract: env.mirrorBridge,
          lastBlock: last,
        })

        if (logs.length || inserted) {
          console.log(
            `[ChainMirror:RO] logs=${logs.length} inserted=${inserted} cursor=${last}`
          )
        }

        from = to + 1n
      }

      await sleep(env.pollMs)
    } catch (err: any) {
      console.error(
        '[ChainMirror:RO] poll error',
        err?.shortMessage || err
      )

      await sleep(Math.max(5000, env.pollMs))
    }
  }
}
