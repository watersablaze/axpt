import { authorityKernel } from "@/domains/auth/AuthorityKernel"
import { PERMISSIONS } from "@/domains/auth/permissions"
import type { Principal } from "@/domains/auth/types"

import type { CommunicationsDatabaseClient } from "../shared/databaseTypes"

export type CommunicationDirectoryPurpose =
  | "DIRECT"
  | "GROUP"

export type CommunicationDirectoryEntry = {
  id: string
  displayName: string | null
  name: string | null
  email: string
}

type CommunicationDirectoryRow = {
  id: string
  displayName: string | null
  name: string | null
  email: string
}

export async function listCommunicationDirectoryWithClient({
  client,
  principal,
  purpose = "DIRECT",
}: {
  client: CommunicationsDatabaseClient
  principal: Principal
  purpose?: CommunicationDirectoryPurpose
}): Promise<
  CommunicationDirectoryEntry[]
> {
  const requiredPermission =
    purpose ===
    "GROUP"
      ? PERMISSIONS.COMMUNICATIONS_GROUP_CREATE
      : PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE

  authorityKernel.require(
    principal,
    requiredPermission
  )

  const users =
    await client.user.findMany({
      where: {
        id: {
          not:
            principal.userId,
        },

        userRoles: {
          some: {
            isActive:
              true,

            revokedAt:
              null,

            role: {
              rolePermissions: {
                some: {
                  permission: {
                    key:
                      PERMISSIONS.COMMUNICATIONS_ACCESS,
                  },
                },
              },
            },
          },
        },
      },

      select: {
        id:
          true,

        displayName:
          true,

        name:
          true,

        email:
          true,
      },

      orderBy: [
        {
          displayName:
            "asc",
        },
        {
          name:
            "asc",
        },
        {
          email:
            "asc",
        },
      ],
    })

  return users.map(
    (
      user:
        CommunicationDirectoryRow
    ) => ({
      id:
        user.id,

      displayName:
        user.displayName,

      name:
        user.name,

      email:
        user.email,
    })
  )
}
