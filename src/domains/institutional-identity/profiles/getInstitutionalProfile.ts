import { prisma } from "@/infrastructure/db/prisma"

import { getInstitutionalProfileWithClient } from "./getInstitutionalProfileWithClient"

export async function getInstitutionalProfile({
  userId,
}: {
  userId: string
}) {
  return getInstitutionalProfileWithClient({
    client: prisma,
    userId,
  })
}
