import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import {
  listCommunicationDirectoryWithClient,
  type CommunicationDirectoryPurpose,
} from "./listCommunicationDirectoryWithClient"

export async function listCommunicationDirectory({
  principal,
  purpose = "DIRECT",
}: {
  principal: Principal
  purpose?: CommunicationDirectoryPurpose
}) {
  return listCommunicationDirectoryWithClient({
    client:
      prisma,

    principal,
    purpose,
  })
}
