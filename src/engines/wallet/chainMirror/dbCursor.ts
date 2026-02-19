import { prisma } from '@/lib/prisma'

/**
 * Get existing cursor or create it.
 * Boundary rule:
 *   - Chain = bigint
 *   - DB = number
 */
export async function getOrCreateCursor(opts: {
  network: string
  contract: string
  startBlock: bigint
}) {
  const { network, contract, startBlock } = opts

  const existing = await prisma.chainMirrorCursor.findUnique({
    where: {
      network_contract: {
        network,
        contract,
      },
    },
  })

  if (existing) return existing

  return prisma.chainMirrorCursor.create({
    data: {
      network,
      contract,
      lastBlock: Number(startBlock), // 🔒 convert here
    },
  })
}

/**
 * Advance cursor safely.
 * Accepts bigint from chain layer.
 */
export async function advanceCursor(opts: {
  network: string
  contract: string
  lastBlock: bigint
}) {
  const { network, contract, lastBlock } = opts

  return prisma.chainMirrorCursor.update({
    where: {
      network_contract: {
        network,
        contract,
      },
    },
    data: {
      lastBlock: Number(lastBlock), // 🔒 convert here
    },
  })
}