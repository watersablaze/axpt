import "dotenv/config"

import {
  PrismaClient,
  type InstitutionalAuthority,
} from "@prisma/client"

import {
  FOUNDING_OPERATOR_DEFINITIONS,
  type FoundingOperatorKey,
} from "../../src/domains/institutional-identity/founding/foundingOperatorDefinitions"

const prisma = new PrismaClient()

function requiredUsername(envKey: string) {
  const value = process.env[envKey]?.trim()

  if (!value) {
    throw new Error(
      `FOUNDING_OPERATOR_USERNAME_MISSING:${envKey}`
    )
  }

  return value
}

async function main() {
  const configured = FOUNDING_OPERATOR_DEFINITIONS.map(
    (definition) => ({
      definition,
      username: requiredUsername(
        definition.envUsernameKey
      ),
    })
  )

  const normalizedUsernames = configured.map(
    ({ username }) => username.toLowerCase()
  )

  if (
    new Set(normalizedUsernames).size !==
    normalizedUsernames.length
  ) {
    throw new Error(
      "FOUNDING_OPERATOR_USERNAME_DUPLICATE"
    )
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: configured.map(({ username }) => username),
      },
    },
    select: {
      id: true,
      username: true,
    },
  })

  const userByUsername = new Map(
    users.map((user) => [
      user.username.toLowerCase(),
      user,
    ])
  )

  const resolved = configured.map(
    ({ definition, username }) => {
      const user = userByUsername.get(
        username.toLowerCase()
      )

      if (!user) {
        throw new Error(
          `FOUNDING_OPERATOR_USER_NOT_FOUND:${definition.key}:${definition.envUsernameKey}`
        )
      }

      return {
        definition,
        user,
      }
    }
  )

  if (
    new Set(resolved.map(({ user }) => user.id))
      .size !== resolved.length
  ) {
    throw new Error(
      "FOUNDING_OPERATOR_USER_ID_COLLISION"
    )
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const profiles =
        new Map<FoundingOperatorKey, {
          id: string
          userId: string
          operatorCode: string
        }>()

      for (const {
        definition,
        user,
      } of resolved) {
        const profile =
          await tx.institutionalProfile.upsert({
            where: {
              userId: user.id,
            },
            update: {
              displayName:
                definition.displayName,
              institutionalTitle:
                definition.institutionalTitle,
              roleClass:
                definition.roleClass,
              organizationalUnit:
                definition.organizationalUnit,
              standing:
                definition.standing,
              operatorCode:
                definition.operatorCode,
              fiduciaryIndependent:
                definition.fiduciaryIndependent,
              summary:
                definition.summary,
              activatedAt: new Date(),
              suspendedAt: null,
            },
            create: {
              userId: user.id,
              displayName:
                definition.displayName,
              institutionalTitle:
                definition.institutionalTitle,
              roleClass:
                definition.roleClass,
              organizationalUnit:
                definition.organizationalUnit,
              standing:
                definition.standing,
              operatorCode:
                definition.operatorCode,
              fiduciaryIndependent:
                definition.fiduciaryIndependent,
              summary:
                definition.summary,
              activatedAt: new Date(),
            },
            select: {
              id: true,
              userId: true,
              operatorCode: true,
            },
          })

        profiles.set(
          definition.key,
          profile
        )
      }

      for (const { definition } of resolved) {
        const profile =
          profiles.get(definition.key)

        if (!profile) {
          throw new Error(
            `FOUNDING_OPERATOR_PROFILE_MISSING:${definition.key}`
          )
        }

        const reportsToProfileId =
          definition.reportsToKey
            ? profiles.get(
                definition.reportsToKey
              )?.id
            : null

        if (
          definition.reportsToKey &&
          !reportsToProfileId
        ) {
          throw new Error(
            `FOUNDING_OPERATOR_REPORTING_TARGET_MISSING:${definition.key}`
          )
        }

        await tx.institutionalProfile.update({
          where: {
            id: profile.id,
          },
          data: {
            reportsToProfileId,
          },
        })
      }

      const mayaProfile = profiles.get("MAYA")

      if (!mayaProfile) {
        throw new Error(
          "FOUNDING_OPERATOR_MAYA_PROFILE_MISSING"
        )
      }

      for (const { definition } of resolved) {
        const recipient =
          profiles.get(definition.key)

        if (!recipient) {
          throw new Error(
            `FOUNDING_OPERATOR_PROFILE_MISSING:${definition.key}`
          )
        }

        for (
          const authority of definition.authorities
        ) {
          await ensureGlobalAuthorityGrant({
            tx,
            recipientProfileId: recipient.id,
            issuedByProfileId:
              mayaProfile.id,
            authority,
          })
        }
      }

      return Array.from(profiles.entries()).map(
        ([key, profile]) => ({
          key,
          ...profile,
        })
      )
    }
  )

  console.log(
    "✓ Founding institutional profiles bootstrapped"
  )

  console.table(result)
}

async function ensureGlobalAuthorityGrant({
  tx,
  recipientProfileId,
  issuedByProfileId,
  authority,
}: {
  tx: Parameters<
    Parameters<typeof prisma.$transaction>[0]
  >[0]
  recipientProfileId: string
  issuedByProfileId: string
  authority: InstitutionalAuthority
}) {
  const existing =
    await tx.institutionalAuthorityGrant.findFirst({
      where: {
        recipientProfileId,
        authority,
        scopeType: "GLOBAL",
        scopeId: null,
        status: "ACTIVE",
      },
      orderBy: {
        issuedAt: "asc",
      },
    })

  if (existing) {
    await tx.institutionalAuthorityGrant.update({
      where: {
        id: existing.id,
      },
      data: {
        issuedByProfileId,
        effectiveAt:
          existing.effectiveAt,
        expiresAt: null,
        revokedAt: null,
      },
    })

    return
  }

  await tx.institutionalAuthorityGrant.create({
    data: {
      recipientProfileId,
      issuedByProfileId,
      authority,
      scopeType: "GLOBAL",
      status: "ACTIVE",
      rationale:
        "Founding institutional authority bootstrap",
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
