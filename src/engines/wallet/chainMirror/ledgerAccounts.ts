import { prisma } from '@/lib/prisma'

type ResolveAccountOpts = {
  chainId: number
  tokenType: string
  treasuryAddress: `0x${string}`
  address: `0x${string}`
}

function normalizeAddress(a: string) {
  return a.toLowerCase()
}

export async function resolveLedgerAccountId(opts: ResolveAccountOpts) {
  const { chainId, tokenType, treasuryAddress, address } = opts

  const addr = normalizeAddress(address)
  const treasury = normalizeAddress(treasuryAddress)

  const type =
    addr === treasury ? 'TREASURY' : 'EXTERNAL' // we can evolve USER mapping later

  const existing = await prisma.ledgerAccount.findFirst({
    where: {
      chainId,
      tokenType,
      type: type as any,
      address: addr,
    },
    select: { id: true },
  })

  if (existing) return existing.id

  const created = await prisma.ledgerAccount.create({
    data: {
      chainId,
      tokenType,
      type: type as any,
      address: addr,
      label: type === 'TREASURY' ? 'Treasury' : `External:${addr.slice(0, 10)}…`,
    },
    select: { id: true },
  })

  return created.id
}