type PublicOperationalLinkSource = {
  id: string
  targetType: unknown
  targetSubtype: string
  targetId: string
  linkedByUserId: string
  linkedAt: Date
}

type PublicOperationalRoomSource = {
  id: string
  roomClass: unknown
  createdByUserId: string
  createdAt: Date
  updatedAt: Date
  links: PublicOperationalLinkSource[]
}

type CommunicationConversationWithOperationalRoom = {
  operationalRoom:
    | (
        PublicOperationalRoomSource & {
          conversationId?: string
          clientRoomId?: string
          requestFingerprint?: string
        }
      )
    | null
}

export function toPublicCommunicationConversation<
  T extends CommunicationConversationWithOperationalRoom,
>(
  conversation: T
) {
  const {
    operationalRoom,
    ...publicConversation
  } = conversation

  if (!operationalRoom) {
    return {
      ...publicConversation,
      operationalRoom:
        null,
    }
  }

  return {
    ...publicConversation,

    operationalRoom: {
      id:
        operationalRoom.id,

      roomClass:
        operationalRoom.roomClass,

      createdByUserId:
        operationalRoom.createdByUserId,

      createdAt:
        operationalRoom.createdAt,

      updatedAt:
        operationalRoom.updatedAt,

      links:
        operationalRoom.links.map(
          ({
            id,
            targetType,
            targetSubtype,
            targetId,
            linkedByUserId,
            linkedAt,
          }) => ({
            id,
            targetType,
            targetSubtype,
            targetId,
            linkedByUserId,
            linkedAt,
          })
        ),
    },
  }
}
