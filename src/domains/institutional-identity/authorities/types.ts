import type {
  InstitutionalAuthority,
  InstitutionalAuthorityScopeType,
} from "@prisma/client"

export type InstitutionalAuthorityScope = Readonly<{
  type: InstitutionalAuthorityScopeType
  id?: string
}>

export type InstitutionalAuthorityCheck = Readonly<{
  authority: InstitutionalAuthority
  scope?: InstitutionalAuthorityScope
  at?: Date
}>
