import 'dotenv/config'
import { createPublicClient, http } from 'viem'
import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'

// ─────────────────────────────────────────────
// Cursor (memory-only for now)
// ─────────────────────────────────────────────

type ChainCursor = {
  chain: string
  contract: `0x${string}`
  lastBlock: bigint
}

let cursor: ChainCursor | null = null

function loadCursor(chain: string, contract: `0x${string}`): ChainCursor {
  if (!cursor) {
    cursor = {
      chain,
      contract,
      lastBlock: 0n, // will anchor on first poll
    }
  }
  return cursor
}

function advanceCursor(block: bigint) {
  if (!cursor) return
  if (block > cursor.lastBlock) {
    cursor.lastBlock = block
  }
}

// ─────────────────────────────────────────────
// Scan window (Alchemy-safe)
// ─────────────────────────────────────────────

function computeScanWindow(
  lastBlock: bigint,
  latestBlock: bigint,
  maxRange = 10n
) {
  const fromBlock = lastBlock + 1n
  if (fromBlock > latestBlock) return null

  const toBlock = fromBlock + maxRange - 1n
  return {
    fromBlock,
    toBlock: toBlock > latestBlock ? latestBlock : toBlock,
  }
}

// ─────────────────────────────────────────────
// Worker
// ─────────────────────────────────────────────

export async function startReadOnlyChainMirror() {
  console.log('[ChainMirror:RO] starting read-only loop…')

  const env = validateChainMirrorEnv()

  const client = createPublicClient({
    transport: http(env.rpcUrl),
  })

  const cursor = loadCursor(env.network, env.mirrorBridge)

  // Anchor cursor to current chain head on first run
  if (cursor.lastBlock === 0n) {
    const head = await client.getBlockNumber()
    cursor.lastBlock = head
    console.log(`[ChainMirror:RO] anchored at block ${head}`)
  }

  while (true) {
    try {
      const latest = await client.getBlockNumber()
      const window = computeScanWindow(cursor.lastBlock, latest)

      if (!window) {
        await sleep(env.pollMs)
        continue
      }

      console.log(
        `[ChainMirror:RO] scanning blocks ${window.fromBlock} → ${window.toBlock}`
      )

      const logs = await client.getLogs({
        address: env.mirrorBridge,
        fromBlock: window.fromBlock,
        toBlock: window.toBlock,
      })

      // 🔎 For now: just observe
      if (logs.length > 0) {
        console.log(`[ChainMirror:RO] ${logs.length} log(s) observed`)
      }

      // Advance cursor ONLY after successful scan
      advanceCursor(window.toBlock)
    } catch (err) {
      console.error('[ChainMirror:RO] poll error', err)
    }

    await sleep(env.pollMs)
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

// Allow direct execution
if (require.main === module) {
  startReadOnlyChainMirror()
}