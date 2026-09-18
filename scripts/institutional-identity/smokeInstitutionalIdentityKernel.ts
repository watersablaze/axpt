import { prisma } from "../../src/infrastructure/db/prisma"
import { getInstitutionalProfileWithClient } from "../../src/domains/institutional-identity/profiles/getInstitutionalProfileWithClient"

async function main() {
  const probe = await prisma.user.findFirst({
    select: {
      id: true,
    },
  })

  if (!probe) {
    console.log(
      "✓ Institutional identity kernel schema reachable; no user fixture available for profile lookup"
    )
    return
  }

  const profile = await getInstitutionalProfileWithClient({
    client: prisma,
    userId: probe.id,
  })

  if (
    profile !== null &&
    profile.userId !== probe.id
  ) {
    throw new Error(
      "INSTITUTIONAL_IDENTITY_PROFILE_USER_MISMATCH"
    )
  }

  console.log(
    "✓ Institutional identity kernel smoke test passed"
  )

  console.log({
    probeUserId: probe.id,
    profileFound: profile !== null,
    operatorCode: profile?.operatorCode ?? null,
    standing: profile?.standing ?? null,
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
