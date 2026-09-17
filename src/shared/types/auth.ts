export type BusinessTier =
  | 'Investor'
  | 'Partner'
  | 'Farmer'
  | 'Merchant'
  | 'Nomad'
  | 'Board'

export type SystemRole = string

export type SessionTier =
  | BusinessTier
  | 'platform'
  | 'operations'

export type SessionDocument = 'whitepaper' | 'hemp' | 'chinje'

export type SessionPayload = {
  userId: string
  tokenId?: string
  tier: SessionTier
  roles: SystemRole[]
  displayName: string
  docs: SessionDocument[]
  popupMessage: string
  greeting: string
  partner: string
  iat: number
  exp: number
  email?: string
}
