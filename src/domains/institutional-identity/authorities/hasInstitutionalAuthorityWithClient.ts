import type {
  InstitutionalAuthority,
  InstitutionalAuthorityScopeType,
} from "@prisma/client"

import type { InstitutionalIdentityDatabaseClient } from "../shared/databaseTypes"
import { listActiveAuthorityGrantsWithClient } from "./listActiveAuthorityGrantsWithClient"

export async function hasInstitutionalAuthorityWithClient({
  client,
  recipientProfileId,
  authority,
  scopeType = "GLOBAL",
  scopeId,
  at = new Date(),
}: {
  client: InstitutionalIdentityDatabaseClient
  recipientProfileId: string
  authority: InstitutionalAuthority
  scopeType?: InstitutionalAuthorityScopeType
  scopeId?: string
  at?: Date
}) {
  const profile = await client.institutionalProfile.findUnique({
    where: {
      id: recipientProfileId,
    },
    select: {
      standing: true,
    },
  })

  if (!profile) {
    return false
  }

  if (
    profile.standing === "SUSPENDED" ||
    profile.standing === "INACTIVE"
  ) {
    return false
  }

  const grants = await listActiveAuthorityGrantsWithClient({
    client,
    recipientProfileId,
    authority,
    at,
  })

  return grants.some((grant) => {
    if (grant.scopeType === "GLOBAL") {
      return true
    }

    if (grant.scopeType !== scopeType) {
      return false
    }

    return grant.scopeId === scopeId
  })
}
