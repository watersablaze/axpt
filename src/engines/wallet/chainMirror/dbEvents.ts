// src/engines/wallet/chainMirror/dbEvents.ts
import { prisma } from '@/lib/prisma'
import { decodeEventLog } from 'viem'
import MirrorBridgeAbi from '../../../../abi/MirrorBridge.json'
import { buildDoubleEntryRows } from './ledgerWriter'
import { resolveLedgerAccountId } from './ledgerAccounts'

type PersistOpts = {
  network: string
  contract: string
  chainId: number
  logs: Array<{
    blockNumber: bigint
    blockHash?: `0x${string}` | null
    transactionHash: `0x${string}`
    logIndex: number
    topics: readonly `0x${string}`[]
    data: `0x${string}`
  }>
}

export async function persistLogs(opts: PersistOpts) {
  const { network, contract, chainId, logs } = opts
  if (!logs.length) return { inserted: 0 }

  let inserted = 0

  for (const l of logs) {
    try {
      const decoded = decodeEventLog({
        abi: MirrorBridgeAbi as any,
        eventName: 'MirrorTransfer',
        topics: [...l.topics] as [`0x${string}`, ...`0x${string}`[]],
        data: l.data,
      })

      const { idempotencyKey, walletEventId, tokenType, from, to, amount } =
        decoded.args as {
          idempotencyKey: `0x${string}`
          walletEventId: `0x${string}`
          tokenType: `0x${string}`
          from: `0x${string}`
          to: `0x${string}`
          amount: bigint
        }

      // ✅ Pre-resolve account IDs OUTSIDE the transaction (removes interactive timeout risk)
      const debitAccountId = await resolveLedgerAccountId({
        chainId,
        tokenType,
        treasuryAddress: contract as any, // if your resolver needs treasury, pass the right value; otherwise remove
        address: from,
      })

      const creditAccountId = await resolveLedgerAccountId({
        chainId,
        tokenType,
        treasuryAddress: contract as any,
        address: to,
      })

      const d = {
        chainId,
        tokenType,
        idempotencyKey,
        walletEventId,
        fromAddress: from,
        toAddress: to,
        amountWei: amount.toString(),
        txHash: l.transactionHash,
        logIndex: l.logIndex,
        blockNumber: l.blockNumber,
        chainTimestamp: null,
      }

      const ledgerRows = buildDoubleEntryRows({
        d,
        debitAccountId,
        creditAccountId,
      })

      // ✅ Batched transaction (NOT interactive callback) => eliminates P2028
      await prisma.$transaction([
        prisma.chainMirrorEvent.create({
          data: {
            network,
            contract,
            chainId,
            txHash: l.transactionHash,
            logIndex: l.logIndex,
            blockNumber: l.blockNumber,
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
          },
        }),
        prisma.ledgerEntry.createMany({
          data: ledgerRows,
          skipDuplicates: true,
        }),
      ])

      inserted++
    } catch (err: any) {
      // If your unique constraints throw P2002, treat as idempotent duplicate
      if (err?.code === 'P2002') continue

      console.warn('[ChainMirror] failed to process log', err)
    }
  }

  return { inserted }
}