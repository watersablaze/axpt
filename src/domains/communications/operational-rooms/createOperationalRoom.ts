import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { createOperationalRoomWithClient } from "./createOperationalRoomWithClient"

export async function createOperationalRoom({
  principal,
  clientRoomId,
  title,
  roomClass,
  memberUserIds,
}: {
  principal: Principal
  clientRoomId: string
  title: string
  roomClass: string
  memberUserIds: string[]
}) {
  return createOperationalRoomWithClient({
    client:
      prisma,

    principal,
    clientRoomId,
    title,
    roomClass,
    memberUserIds,
  })
}
