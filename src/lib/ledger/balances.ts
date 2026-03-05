import { prisma } from '@/lib/prisma'

export type LedgerBalanceRow = {
  chainId: number
  tokenType: string
  accountId: string
  balance: string
}

export async function getAllBalances(): Promise<LedgerBalanceRow[]> {
  return prisma.$queryRaw<LedgerBalanceRow[]>`
    SELECT * FROM "LedgerBalances"
  `
}

export async function getAccountBalance(opts: {
  accountId: string
  tokenType?: string
  chainId?: number
}) {
  const { accountId, tokenType, chainId } = opts

  return prisma.$queryRaw<LedgerBalanceRow[]>`
    SELECT *
    FROM "LedgerBalances"
    WHERE "accountId" = ${accountId}
    ${tokenType ? prisma.$queryRaw`AND "tokenType" = ${tokenType}` : prisma.$queryRaw``}
    ${chainId ? prisma.$queryRaw`AND "chainId" = ${chainId}` : prisma.$queryRaw``}
  `
}

export async function checkLedgerIntegrity() {
  const pairIssues = await prisma.$queryRaw`
    SELECT * FROM "LedgerIntegrityPairs"
  `

  const amountIssues = await prisma.$queryRaw`
    SELECT * FROM "LedgerIntegrityAmounts"
  `

  return {
    pairIssues,
    amountIssues,
    healthy:
      (pairIssues as any[]).length === 0 &&
      (amountIssues as any[]).length === 0,
  }
}