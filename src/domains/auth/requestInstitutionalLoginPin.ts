export type InstitutionalLoginCandidate = {
  eligible: boolean
} | null

export type InstitutionalPinRequestDependencies = {
  transportReady(): boolean

  findCandidate(
    email: string,
  ): Promise<InstitutionalLoginCandidate>

  generatePin(): string

  hashPin(
    pin: string,
  ): Promise<string>

  claim(input: {
    email: string
    pinHash: string
    now: Date
  }): Promise<boolean>

  deliver(input: {
    email: string
    pin: string
    expiresInMinutes: number
  }): Promise<void>

  cleanup(input: {
    email: string
    pinHash: string
  }): Promise<void>
}

export type InstitutionalPinRequestResult =
  | 'UNAVAILABLE'
  | 'ACCEPTED'

export async function requestInstitutionalLoginPin(
  dependencies: InstitutionalPinRequestDependencies,
  rawEmail: unknown,
  now: Date = new Date(),
): Promise<InstitutionalPinRequestResult> {
  if (!dependencies.transportReady()) {
    return 'UNAVAILABLE'
  }

  if (!Number.isFinite(now.getTime())) {
    return 'UNAVAILABLE'
  }

  if (typeof rawEmail !== 'string') {
    return 'ACCEPTED'
  }

  const email = rawEmail.trim().toLowerCase()

  if (
    email.length < 3 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return 'ACCEPTED'
  }

  const candidate =
    await dependencies.findCandidate(email)

  if (
    !candidate ||
    !candidate.eligible
  ) {
    return 'ACCEPTED'
  }

  const pin = dependencies.generatePin()

  if (!/^\d{6}$/.test(pin)) {
    throw new Error('INVALID_PIN_GENERATOR')
  }

  const pinHash =
    await dependencies.hashPin(pin)

  const claimed =
    await dependencies.claim({
      email,
      pinHash,
      now,
    })

  if (!claimed) {
    return 'ACCEPTED'
  }

  try {
    await dependencies.deliver({
      email,
      pin,
      expiresInMinutes: 10,
    })
  } catch {
    try {
      await dependencies.cleanup({
        email,
        pinHash,
      })
    } catch {
      return 'UNAVAILABLE'
    }

    return 'UNAVAILABLE'
  }

  return 'ACCEPTED'
}
