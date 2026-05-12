import crypto from 'crypto'

export function createExecutionFingerprint(input: {
  from: string
  to: string
  assetCode: string
  amount: bigint
  organismHash: string
  nonce: number
}) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        ...input,
        amount: input.amount.toString(),
      })
    )
    .digest('hex')
}