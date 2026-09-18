import type { InstitutionalIdentityDatabaseClient } from "../shared/databaseTypes"

export async function getInstitutionalProfileWithClient({
  client,
  userId,
}: {
  client: InstitutionalIdentityDatabaseClient
  userId: string
}) {
  return client.institutionalProfile.findUnique({
    where: {
      userId,
    },
    include: {
      reportsTo: true,
      directReports: {
        orderBy: {
          displayName: "asc",
        },
      },
    },
  })
}
