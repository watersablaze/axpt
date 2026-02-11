import { createPublicClient, http } from 'viem'
import MirrorBridgeAbi from '../../../../abi/MirrorBridge.json'
import { validateChainMirrorEnv } from '@/lib/env/validateChainMirrorEnv'

console.log('[ChainMirror:RO] starting read-only loop…')

// 🔒 Hard gate
const env = validateChainMirrorEnv()

const client = createPublicClient({
  transport: http(env.rpcUrl),
})

let lastBlock: bigint | null = null

async function pollOnce() {
  const currentBlock = await client.getBlockNumber()

  if (lastBlock === null) {
    // First run: anchor without backfill
    lastBlock = currentBlock
    console.log('[ChainMirror:RO] anchored at block', currentBlock.toString())
    return
  }

  if (currentBlock <= lastBlock) return

  console.log(
    `[ChainMirror:RO] scanning blocks ${lastBlock + 1n} → ${currentBlock}`
  )

  const logs = await client.getLogs({
    address: env.mirrorBridge,
    abi: MirrorBridgeAbi,
    eventName: 'MirrorTransfer',
    fromBlock: lastBlock + 1n,
    toBlock: currentBlock,
  })

  for (const log of logs) {
    const {
      idempotencyKey,
      walletEventId,
      tokenType,
      from,
      to,
      amount,
    } = log.args

    console.log('[ChainMirror:RO] MirrorTransfer detected')
    console.log('  block:', log.blockNumber?.toString())
    console.log('  idempotencyKey:', idempotencyKey)
    console.log('  walletEventId:', walletEventId)
    console.log('  tokenType:', tokenType)
    console.log('  from:', from)
    console.log('  to:', to)
    console.log('  amount:', amount.toString())

    // 🔍 Optional: check consumed flag
    const alreadyConsumed = await client.readContract({
      address: env.mirrorBridge,
      abi: MirrorBridgeAbi,
      functionName: 'consumed',
      args: [idempotencyKey],
    })

    console.log('  consumed:', alreadyConsumed)
  }

  lastBlock = currentBlock
}

async function loop() {
  while (true) {
    try {
      await pollOnce()
    } catch (err) {
      console.error('[ChainMirror:RO] poll error', err)
    }

    await new Promise((r) => setTimeout(r, env.pollMs))
  }
}

loop().catch((err) => {
  console.error('[ChainMirror:RO] fatal error', err)
  process.exit(1)
})