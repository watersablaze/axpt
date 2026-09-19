import type {
  InstitutionalAuthority,
  InstitutionalAuthorityScopeType,
} from "@prisma/client"

import { prisma } from "@/infrastructure/db/prisma"

import { hasInstitutionalAuthorityWithClient } from "./hasInstitutionalAuthorityWithClient"

export async function hasInstitutionalAuthority({
  recipientProfileId,
  authority,
  scopeType = "GLOBAL",
  scopeId,
  at,
}: {
  recipientProfileId: string
  authority: InstitutionalAuthority
  scopeType?: InstitutionalAuthorityScopeType
  scopeId?: string
  at?: Date
}) {
  return hasInstitutionalAuthorityWithClient({
    client: prisma,
    recipientProfileId,
    authority,
    scopeType,
    scopeId,
    at,
  })
}
