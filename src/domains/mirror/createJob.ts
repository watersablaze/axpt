import type { PrismaClient, TransactionClient } from "@prisma/client"
import { bigintToDecimal } from "@/lib/money/baseUnits"
import { getAsset, type AssetCode } from "@/lib/assets/registry"
import { normalizeAddress } from "@/domains/mirror/encoding"

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type CreateMirrorJobInput = {
  walletEventId: string
  idempotencyKey: string
  assetCode: AssetCode
  amountBaseUnits: bigint
  fromAddress: string
  toAddress: string
}

export async function createMirrorJob(
  prisma: TransactionClient | PrismaClient,
  input: CreateMirrorJobInput
) {
  const asset = getAsset(input.assetCode)
  const fromAddress =
    input.fromAddress === ZERO_ADDRESS
      ? ZERO_ADDRESS
      : normalizeAddress(input.fromAddress)
  const toAddress =
    input.toAddress === ZERO_ADDRESS
      ? ZERO_ADDRESS
      : normalizeAddress(input.toAddress)

  if (input.amountBaseUnits <= 0n) {
    throw new Error('Mirror job must have positive amount')
  }
  if (asset.settlementMode !== "MIRRORED") {
    throw new Error(`Asset ${input.assetCode} is not configured for mirror settlement`)
  }

  return prisma.chainMirrorJob.create({
    data: {
      walletEventId: input.walletEventId,
      idempotencyKey: input.idempotencyKey,
      assetCode: input.assetCode,
      amountBaseUnits: bigintToDecimal(input.amountBaseUnits),
      fromAddress,
      toAddress,
      status: "PENDING",
    },
  })
}
