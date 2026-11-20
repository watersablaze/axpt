export type PinChallengeStore = {
  pinLoginRequest: {
    updateMany(args: {
      where: {
        email: string
        OR: Array<Record<string, unknown>>
      }
      data: {
        pinHash: string
        attemptCount: number
        expiresAt: Date
        consumedAt: null
      }
    }): Promise<{ count: number }>
    create(args: {
      data: {
        email: string
        pinHash: string
        attemptCount: number
        expiresAt: Date
        consumedAt: null
      }
    }): Promise<unknown>
  }
}

export async function claimInstitutionalPinChallenge(
  store: PinChallengeStore,
  input: {
    email: string
    pinHash: string
    now: Date
  },
): Promise<boolean> {
  const expiresAt = new Date(
    input.now.getTime() + 10 * 60_000,
  )

  const data = {
    email: input.email,
    pinHash: input.pinHash,
    attemptCount: 0,
    expiresAt,
    consumedAt: null,
  } as const

  const existing = await store.pinLoginRequest.updateMany({
    where: {
      email: input.email,
      OR: [
        { consumedAt: { not: null } },
        { expiresAt: { lte: input.now } },
      ],
    },
    data: {
      pinHash: data.pinHash,
      attemptCount: data.attemptCount,
      expiresAt: data.expiresAt,
      consumedAt: null,
    },
  })

  if (existing.count === 1) return true
  if (existing.count !== 0) {
    throw new Error('UNEXPECTED_PIN_CLAIM_CARDINALITY')
  }

  try {
    await store.pinLoginRequest.create({ data })
    return true
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return false
    }
    throw error
  }
}
