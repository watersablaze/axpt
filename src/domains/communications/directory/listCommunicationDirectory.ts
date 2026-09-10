import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { listCommunicationDirectoryWithClient } from "./listCommunicationDirectoryWithClient"

export async function listCommunicationDirectory({
  principal,
}: {
  principal: Principal
}) {
  return listCommunicationDirectoryWithClient({
    client:
      prisma,

    principal,
  })
}
