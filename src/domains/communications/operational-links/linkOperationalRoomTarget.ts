import { prisma } from "@/infrastructure/db/prisma"
import type { Principal } from "@/domains/auth/types"

import { linkOperationalRoomTargetWithClient } from "./linkOperationalRoomTargetWithClient"

export async function linkOperationalRoomTarget({
  principal,
  roomId,
  targetType,
  targetSubtype,
  targetId,
}: {
  principal: Principal
  roomId: string
  targetType: string
  targetSubtype: string
  targetId: string
}) {
  return linkOperationalRoomTargetWithClient({
    client:
      prisma,

    principal,
    roomId,
    targetType,
    targetSubtype,
    targetId,
  })
}
