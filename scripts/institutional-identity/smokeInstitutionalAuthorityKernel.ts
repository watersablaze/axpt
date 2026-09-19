import { prisma } from "../../src/infrastructure/db/prisma"
import { hasInstitutionalAuthorityWithClient } from "../../src/domains/institutional-identity/authorities/hasInstitutionalAuthorityWithClient"

async function main() {
  const profile = await prisma.institutionalProfile.findFirst({
    select: {
      id: true,
      standing: true,
    },
  })

  if (!profile) {
    console.log(
      "✓ Institutional authority kernel schema reachable; no institutional profile fixture available"
    )
    return
  }

  const canCommunicate = await hasInstitutionalAuthorityWithClient({
    client: prisma,
    recipientProfileId: profile.id,
    authority: "COMMUNICATION",
  })

  if (profile.standing === "SUSPENDED" && canCommunicate) {
    throw new Error(
      "INSTITUTIONAL_AUTHORITY_SUSPENDED_PROFILE_ALLOWED"
    )
  }

  console.log(
    "✓ Institutional authority kernel smoke test passed"
  )

  console.log({
    profileId: profile.id,
    standing: profile.standing,
    communicationAllowed: canCommunicate,
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
