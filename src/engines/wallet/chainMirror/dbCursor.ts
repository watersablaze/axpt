import { prisma } from '@/lib/prisma'

/**
 * Cursor boundary rules:
 *  - Chain = bigint
 *  - DB = number
 *  - Uniqueness = (chainId, contract)
 */

export async function getOrCreateCursor(opts: {
  chainId: number
  network: string
  contract: string
  startBlock: bigint
}) {
  const { chainId, network, contract, startBlock } = opts

  const existing = await prisma.chainMirrorCursor.findUnique({
    where: {
      chainId_contract: {
        chainId,
        contract,
      },
    },
  })

  if (existing) return existing

  return prisma.chainMirrorCursor.create({
    data: {
      chainId,
      network,
      contract,
      lastBlock: Number(startBlock), // 🔒 convert bigint → number at boundary
    },
  })
}

/**
 * Advance cursor safely.
 * Accepts bigint from chain layer.
 */
export async function advanceCursor(opts: {
  chainId: number
  contract: string
  network: string
  lastBlock: bigint
}) {
  const { chainId, contract, network, lastBlock } = opts

  return prisma.chainMirrorCursor.upsert({
    where: {
      chainId_contract: {
        chainId,
        contract,
      },
    },
    update: {
      lastBlock: Number(lastBlock),
    },
    create: {
      chainId,
      contract,
      network,
      lastBlock: Number(lastBlock),
    },
  })
}