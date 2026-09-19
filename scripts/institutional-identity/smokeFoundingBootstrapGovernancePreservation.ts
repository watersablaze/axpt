import "dotenv/config"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const bobby = await prisma.institutionalProfile.findFirst({
    where: {
      operatorCode: "FW-BOBBY-001",
    },
    select: {
      id: true,
      standing: true,
      reportsToProfileId: true,
      authorityGrantsReceived: {
        where: {
          authority: "COMMUNICATION",
          scopeType: "GLOBAL",
        },
        orderBy: {
          issuedAt: "desc",
        },
        select: {
          status: true,
        },
      },
    },
  })

  if (!bobby) {
    console.log(
      "✓ Founding rerun protection smoke skipped; Bobby profile not bootstrapped"
    )
    return
  }

  const latestCommunicationGrant =
    bobby.authorityGrantsReceived[0]

  if (!latestCommunicationGrant) {
    throw new Error(
      "FOUNDING_RERUN_PROTECTION_COMMUNICATION_GRANT_MISSING"
    )
  }

  console.log(
    "✓ Founding bootstrap rerun protection state readable"
  )

  console.log({
    bobbyStanding: bobby.standing,
    bobbyReportsToProfileId:
      bobby.reportsToProfileId,
    bobbyCommunicationGrantStatus:
      latestCommunicationGrant.status,
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
