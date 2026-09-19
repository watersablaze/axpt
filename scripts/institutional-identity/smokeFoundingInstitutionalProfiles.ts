import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import {
  FOUNDING_OPERATOR_DEFINITIONS,
} from "../../src/domains/institutional-identity/founding/foundingOperatorDefinitions"

const prisma = new PrismaClient()

async function main() {
  const configured =
    FOUNDING_OPERATOR_DEFINITIONS.map(
      (definition) => ({
        definition,
        username:
          process.env[
            definition.envUsernameKey
          ]?.trim() ?? "",
      })
    )

  const missingConfiguration =
    configured.filter(
      ({ username }) => !username
    )

  if (missingConfiguration.length > 0) {
    throw new Error(
      `FOUNDING_OPERATOR_CONFIGURATION_INCOMPLETE:${missingConfiguration
        .map(
          ({ definition }) =>
            definition.envUsernameKey
        )
        .join(",")}`
    )
  }

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: configured.map(
          ({ username }) => username
        ),
      },
    },
    select: {
      id: true,
      username: true,
      institutionalProfile: {
        select: {
          id: true,
          operatorCode: true,
          standing: true,
          reportsToProfileId: true,
          fiduciaryIndependent: true,
          authorityGrantsReceived: {
            where: {
              status: "ACTIVE",
              scopeType: "GLOBAL",
            },
            select: {
              authority: true,
            },
          },
        },
      },
    },
  })

  if (users.length !== configured.length) {
    throw new Error(
      "FOUNDING_OPERATOR_RESOLUTION_INCOMPLETE"
    )
  }

  const userByUsername = new Map(
    users.map((user) => [
      user.username.toLowerCase(),
      user,
    ])
  )

  for (const {
    definition,
    username,
  } of configured) {
    const user = userByUsername.get(
      username.toLowerCase()
    )

    if (!user) {
      throw new Error(
        `FOUNDING_OPERATOR_USER_NOT_FOUND:${definition.key}`
      )
    }

    const profile =
      user.institutionalProfile

    if (!profile) {
      throw new Error(
        `FOUNDING_OPERATOR_PROFILE_NOT_FOUND:${definition.key}`
      )
    }

    if (
      profile.operatorCode !==
      definition.operatorCode
    ) {
      throw new Error(
        `FOUNDING_OPERATOR_CODE_MISMATCH:${definition.key}`
      )
    }

    const activeAuthorities = new Set(
      profile.authorityGrantsReceived.map(
        (grant) => grant.authority
      )
    )

    for (
      const authority of definition.authorities
    ) {
      if (
        !activeAuthorities.has(authority)
      ) {
        throw new Error(
          `FOUNDING_OPERATOR_AUTHORITY_MISSING:${definition.key}:${authority}`
        )
      }
    }

    if (
      definition.key === "BOBBY" &&
      activeAuthorities.has("NEGOTIATION")
    ) {
      throw new Error(
        "FOUNDING_OPERATOR_BOBBY_GLOBAL_NEGOTIATION_NOT_ALLOWED"
      )
    }

    if (
      definition.key === "LAWRENCE" &&
      activeAuthorities.has(
        "TREASURY_EXECUTION"
      )
    ) {
      throw new Error(
        "FOUNDING_OPERATOR_LAWRENCE_TREASURY_EXECUTION_NOT_ALLOWED"
      )
    }
  }

  console.log(
    "✓ Founding institutional operator bootstrap smoke test passed"
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
