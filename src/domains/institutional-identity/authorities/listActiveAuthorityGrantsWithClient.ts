import type {
  InstitutionalAuthority,
  InstitutionalAuthorityScopeType,
} from "@prisma/client"

import type { InstitutionalIdentityDatabaseClient } from "../shared/databaseTypes"

export async function listActiveAuthorityGrantsWithClient({
  client,
  recipientProfileId,
  authority,
  scopeType,
  scopeId,
  at = new Date(),
}: {
  client: InstitutionalIdentityDatabaseClient
  recipientProfileId: string
  authority?: InstitutionalAuthority
  scopeType?: InstitutionalAuthorityScopeType
  scopeId?: string
  at?: Date
}) {
  return client.institutionalAuthorityGrant.findMany({
    where: {
      recipientProfileId,
      status: "ACTIVE",
      effectiveAt: {
        lte: at,
      },
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: at,
          },
        },
      ],
      ...(authority
        ? {
            authority,
          }
        : {}),
      ...(scopeType
        ? {
            scopeType,
          }
        : {}),
      ...(scopeId !== undefined
        ? {
            scopeId,
          }
        : {}),
    },
    orderBy: [
      {
        effectiveAt: "asc",
      },
      {
        issuedAt: "asc",
      },
    ],
  })
}
