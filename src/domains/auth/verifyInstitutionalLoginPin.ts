export type InstitutionalAudience =
  | 'ADMIN'
  | 'FRENCH_WARD_GOVERNING'
  | 'REPRESENTATIVE'
  | 'INSTITUTIONAL_VISITOR'

export type InstitutionalSessionTier =
  | 'operations'
  | 'french-ward-governance'
  | 'representative'
  | 'institutional-visitor'

export type InstitutionalPinChallenge = {
  id: string
  pinHash: string
  attemptCount: number
  expiresAt: Date
  consumedAt: Date | null
}

export type EstablishedInstitutionalSession = {
  userId: string
  email: string
  tokenId: string
  audience: InstitutionalAudience
  tier: InstitutionalSessionTier
  roles: string[]
  displayName: string
}

export type InstitutionalPinVerificationDependencies = {
  findChallenge(
    email: string,
  ): Promise<InstitutionalPinChallenge | null>

  comparePin(
    pin: string,
    hash: string,
  ): Promise<boolean>

  recordInvalidAttempt(input: {
    challengeId: string
    challengePinHash: string
    now: Date
  }): Promise<void>

  establishSession(input: {
    challengeId: string
    challengePinHash: string
    email: string
    now: Date
  }): Promise<EstablishedInstitutionalSession | null>
}

export type InstitutionalPinVerificationResult =
  | { ok: false }
  | {
      ok: true
      session: EstablishedInstitutionalSession
    }

const MAX_ATTEMPTS = 5

export async function verifyInstitutionalLoginPin(
  dependencies:
    InstitutionalPinVerificationDependencies,
  rawEmail: unknown,
  rawPin: unknown,
  now: Date = new Date(),
): Promise<InstitutionalPinVerificationResult> {
  const invalid:
    InstitutionalPinVerificationResult = {
      ok: false,
    }

  if (!Number.isFinite(now.getTime())) {
    return invalid
  }

  if (typeof rawEmail !== 'string') {
    return invalid
  }

  if (typeof rawPin !== 'string') {
    return invalid
  }

  const email =
    rawEmail.trim().toLowerCase()

  const pin =
    rawPin.trim()

  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{6}$/.test(pin)
  ) {
    return invalid
  }

  const challenge =
    await dependencies.findChallenge(email)

  if (
    !challenge ||
    challenge.consumedAt !== null ||
    challenge.expiresAt.getTime() <=
      now.getTime() ||
    challenge.attemptCount >= MAX_ATTEMPTS
  ) {
    return invalid
  }

  const matches =
    await dependencies.comparePin(
      pin,
      challenge.pinHash,
    )

  if (!matches) {
    await dependencies.recordInvalidAttempt({
      challengeId: challenge.id,
      challengePinHash: challenge.pinHash,
      now,
    })

    return invalid
  }

  /*
   * establishSession is the authority seam.
   *
   * Its adapter must atomically:
   * - lock/reload the canonical identity,
   * - reload current institutional standing,
   * - resolve the current audience,
   * - prove the compared challenge hash is still current,
   * - consume this exact challenge version,
   * - create the persisted session.
   *
   * PIN possession alone is insufficient.
   */
  const session =
    await dependencies.establishSession({
      challengeId: challenge.id,
      challengePinHash: challenge.pinHash,
      email,
      now,
    })

  if (!session) {
    return invalid
  }

  return {
    ok: true,
    session,
  }
}
