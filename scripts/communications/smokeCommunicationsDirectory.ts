import { PrismaClient } from "@prisma/client"

import { PERMISSIONS } from "../../src/domains/auth/permissions"
import type { Principal } from "../../src/domains/auth/types"

import { listCommunicationDirectoryWithClient } from "../../src/domains/communications/directory/listCommunicationDirectoryWithClient"

import type { CommunicationsDatabaseClient } from "../../src/domains/communications/shared/databaseTypes"

const prisma =
  new PrismaClient()

function assert(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      message
    )
  }
}

async function main() {
  const nonce =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`

  const client =
    prisma as unknown as CommunicationsDatabaseClient

  const createdUserIds: string[] = []

  let roleId:
    string | null = null

  try {
    const permission =
      await prisma.permission.findUnique({
        where: {
          key:
            PERMISSIONS.COMMUNICATIONS_ACCESS,
        },
      })

    assert(
      permission !== null,
      "COMMUNICATIONS_ACCESS_PERMISSION_NOT_FOUND"
    )

    const role =
      await prisma.role.create({
        data: {
          key:
            `COMMUNICATIONS_DIRECTORY_SMOKE_${nonce}`,

          label:
            "Communications Directory Smoke",

          description:
            "Temporary role for communications directory verification.",

          isSystem:
            false,
        },
      })

    roleId =
      role.id

    await prisma.rolePermission.create({
      data: {
        roleId:
          role.id,

        permissionId:
          permission.id,
      },
    })

    const userA =
      await prisma.user.create({
        data: {
          username:
            `communications-directory-a-${nonce}`,

          email:
            `communications-directory-a-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          displayName:
            "Directory Caller",

          viewedDocs:
            [],
        },
      })

    const userB =
      await prisma.user.create({
        data: {
          username:
            `communications-directory-b-${nonce}`,

          email:
            `communications-directory-b-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          displayName:
            "Eligible Recipient",

          viewedDocs:
            [],
        },
      })

    const userC =
      await prisma.user.create({
        data: {
          username:
            `communications-directory-c-${nonce}`,

          email:
            `communications-directory-c-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          displayName:
            "Revoked Recipient",

          viewedDocs:
            [],
        },
      })

    const userD =
      await prisma.user.create({
        data: {
          username:
            `communications-directory-d-${nonce}`,

          email:
            `communications-directory-d-${nonce}@axpt.local`,

          passwordHash:
            "COMMUNICATIONS_SMOKE_ONLY",

          displayName:
            "No Communications Authority",

          viewedDocs:
            [],
        },
      })

    createdUserIds.push(
      userA.id,
      userB.id,
      userC.id,
      userD.id
    )

    /*
     * B is actively communication-eligible.
     */
    await prisma.userRole.create({
      data: {
        userId:
          userB.id,

        roleId:
          role.id,

        isActive:
          true,
      },
    })

    /*
     * C once had the same role but it has
     * explicitly been revoked.
     */
    await prisma.userRole.create({
      data: {
        userId:
          userC.id,

        roleId:
          role.id,

        isActive:
          false,

        revokedAt:
          new Date(),
      },
    })

    /*
     * D has no role granting
     * COMMUNICATIONS_ACCESS.
     */

    const principalA: Principal = {
      userId:
        userA.id,

      email:
        userA.email,

      displayName:
        userA.displayName,

      roles:
        [],

      permissions: [
        PERMISSIONS.COMMUNICATIONS_ACCESS,
        PERMISSIONS.COMMUNICATIONS_DIRECT_CREATE,
      ],
    }

    const directory =
      await listCommunicationDirectoryWithClient({
        client,
        principal:
          principalA,
      })

    assert(
      directory.some(
        (user) =>
          user.id ===
          userB.id
      ),
      "ELIGIBLE_COMMUNICATION_USER_NOT_LISTED"
    )

    assert(
      !directory.some(
        (user) =>
          user.id ===
          userA.id
      ),
      "DIRECTORY_CALLER_NOT_EXCLUDED"
    )

    assert(
      !directory.some(
        (user) =>
          user.id ===
          userC.id
      ),
      "REVOKED_COMMUNICATION_USER_LISTED"
    )

    assert(
      !directory.some(
        (user) =>
          user.id ===
          userD.id
      ),
      "UNAUTHORIZED_USER_LISTED"
    )

    const eligible =
      directory.find(
        (user) =>
          user.id ===
          userB.id
      )

    assert(
      eligible !== undefined,
      "ELIGIBLE_DIRECTORY_ENTRY_NOT_FOUND"
    )

    const serialized =
      JSON.stringify(
        eligible
      )

    assert(
      !serialized.includes(
        "COMMUNICATIONS_SMOKE_ONLY"
      ),
      "PASSWORD_HASH_LEAKED_TO_DIRECTORY"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        eligible,
        "passwordHash"
      ),
      "DIRECTORY_EXPOSES_PASSWORD_HASH"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        eligible,
        "metadata"
      ),
      "DIRECTORY_EXPOSES_METADATA"
    )

    assert(
      !Object.prototype.hasOwnProperty.call(
        eligible,
        "accessToken"
      ),
      "DIRECTORY_EXPOSES_ACCESS_TOKEN"
    )

    /*
     * A user with Communications access but
     * without DIRECT_CREATE may not browse
     * this initiation directory.
     */
    const principalWithoutCreate:
      Principal = {
        userId:
          userA.id,

        email:
          userA.email,

        roles:
          [],

        permissions: [
          PERMISSIONS.COMMUNICATIONS_ACCESS,
        ],
      }

    let permissionBlocked =
      false

    try {
      await listCommunicationDirectoryWithClient({
        client,

        principal:
          principalWithoutCreate,
      })
    } catch (error: unknown) {
      permissionBlocked =
        error instanceof Error &&
        error.message ===
          "MISSING_PERMISSION:COMMUNICATIONS_DIRECT_CREATE"
    }

    assert(
      permissionBlocked,
      "DIRECTORY_CREATE_PERMISSION_NOT_ENFORCED"
    )

    console.log(
      "✓ Communications directory smoke passed"
    )

    console.log({
      eligibleRecipientListed:
        true,

      callerExcluded:
        true,

      revokedRecipientExcluded:
        true,

      unauthorizedUserExcluded:
        true,

      minimalIdentityProjection:
        true,

      directCreateBoundaryEnforced:
        true,
    })
  } finally {
    if (
      createdUserIds.length >
      0
    ) {
      await prisma.userRole.deleteMany({
        where: {
          userId: {
            in:
              createdUserIds,
          },
        },
      })
    }

    if (
      roleId
    ) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId,
        },
      })

      await prisma.role.deleteMany({
        where: {
          id:
            roleId,
        },
      })
    }

    if (
      createdUserIds.length >
      0
    ) {
      await prisma.user.deleteMany({
        where: {
          id: {
            in:
              createdUserIds,
          },
        },
      })
    }
  }
}

main()
  .catch(
    (error) => {
      console.error(
        error
      )

      process.exitCode =
        1
    }
  )
  .finally(
    async () => {
      await prisma.$disconnect()
    }
  )
