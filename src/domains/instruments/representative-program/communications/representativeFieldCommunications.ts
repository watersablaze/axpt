import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import type { CommunicationsTransactionClient } from "@/domains/communications/shared/databaseTypes";

import { COMMUNICATION_EVENT_TYPE } from "@/domains/communications/events";

import {
  sendMessageInTransactionWithResult,
} from "@/domains/communications/messages/sendMessageInTransaction";

import {
  loadConversationTimelineForMemberWithClient,
  type CommunicationTimelineMessageItem,
} from "@/domains/communications/timeline/loadConversationTimelineWithClient";

import {
  markConversationReadForMemberWithClient,
} from "@/domains/communications/membership/markConversationReadWithClient";

export const REPRESENTATIVE_FIELD_MESSAGE_TYPES = [
  "COMMENT",
  "REQUEST",
  "RESOURCE_COMMENT",
] as const;

export type RepresentativeFieldMessageType =
  (typeof REPRESENTATIVE_FIELD_MESSAGE_TYPES)[number];

export const REPRESENTATIVE_FIELD_CONTEXT_TYPES = [
  "WORKSPACE",
  "APPOINTMENT",
  "CUP_RESOURCE",
] as const;

export type RepresentativeFieldContext =
  | {
      type: "WORKSPACE";
    }
  | {
      type: "APPOINTMENT";
      id: string;
    }
  | {
      type: "CUP_RESOURCE";
      id: string;
    };

type ParticipantRecord = {
  id: string;
  docketReference: string;
  displayName: string;
  userId: string | null;
  createdByUserId: string;
};

type FieldSenderRecord = {
  id: string;
  displayName: string | null;
  name: string | null;
  email: string;
};

type TargetPointer = {
  targetType:
    | "REPRESENTATIVE_PROGRAM_PARTICIPANT"
    | "REPRESENTATIVE_APPOINTMENT"
    | "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE";
  targetSubtype:
    | "REPRESENTATIVE_PROGRAM_PARTICIPANT"
    | "REPRESENTATIVE_APPOINTMENT"
    | "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE";
  targetId: string;
};

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_CLIENT_MESSAGE_ID_LENGTH = 200;

function normalizeRequired(value: string, code: string, maxLength = 191) {
  const normalized = value.trim();

  if (!normalized || normalized.length > maxLength) {
    throw new Error(code);
  }

  return normalized;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function roomClientId(participantId: string) {
  return `arp-field:${participantId}`;
}

function roomFingerprint(params: {
  participantId: string;
  representativeUserId: string;
  operatorUserId: string;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        participantId: params.participantId,
        representativeUserId: params.representativeUserId,
        operatorUserId: params.operatorUserId,
      }),
    )
    .digest("hex");
}

async function resolveParticipant(
  client: PrismaClient | CommunicationsTransactionClient,
  userIdInput: string,
): Promise<ParticipantRecord> {
  const userId = normalizeRequired(
    userIdInput,
    "ARP_FIELD_COMMUNICATIONS_USER_ID_INVALID",
  );

  const participants = await client.representativeProgramParticipant.findMany({
    where: {
      userId,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        id: "desc",
      },
    ],
    take: 2,
    select: {
      id: true,
      docketReference: true,
      displayName: true,
      userId: true,
      createdByUserId: true,
    },
  });

  if (participants.length === 0) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_PARTICIPANT_NOT_FOUND");
  }

  if (participants.length !== 1) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_PARTICIPANT_CONTRADICTION");
  }

  const participant = participants[0];

  if (participant.userId !== userId) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_IDENTITY_CONFLICT");
  }

  return participant;
}

async function requireInstitutionalOperator(
  client: PrismaClient | CommunicationsTransactionClient,
  participant: ParticipantRecord,
) {
  const operator = await client.user.findUnique({
    where: {
      id: participant.createdByUserId,
    },
    select: {
      id: true,
      isAdmin: true,
    },
  });

  if (!operator || !operator.isAdmin) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_OPERATOR_UNAVAILABLE");
  }

  return operator;
}

async function resolveOwnedTarget(
  client: PrismaClient | CommunicationsTransactionClient,
  participant: ParticipantRecord,
  context: RepresentativeFieldContext | null | undefined,
): Promise<TargetPointer> {
  if (!context || context.type === "WORKSPACE") {
    return {
      targetType: "REPRESENTATIVE_PROGRAM_PARTICIPANT",
      targetSubtype: "REPRESENTATIVE_PROGRAM_PARTICIPANT",
      targetId: participant.id,
    };
  }

  if (context.type === "APPOINTMENT") {
    const appointmentId = normalizeRequired(
      context.id,
      "ARP_FIELD_COMMUNICATIONS_APPOINTMENT_ID_INVALID",
    );

    const appointment =
      await client.representativeProgramAppointment.findUnique({
        where: {
          id: appointmentId,
        },
        select: {
          id: true,
          participantId: true,
        },
      });

    if (!appointment || appointment.participantId !== participant.id) {
      throw new Error("ARP_FIELD_COMMUNICATIONS_CONTEXT_NOT_OWNED");
    }

    return {
      targetType: "REPRESENTATIVE_APPOINTMENT",
      targetSubtype: "REPRESENTATIVE_APPOINTMENT",
      targetId: appointment.id,
    };
  }

  if (context.type === "CUP_RESOURCE") {
    const resourceReleaseId = normalizeRequired(
      context.id,
      "ARP_FIELD_COMMUNICATIONS_RESOURCE_ID_INVALID",
    );

    const resource =
      await client.commercialUtilityPackResourceRelease.findUnique({
        where: {
          id: resourceReleaseId,
        },
        select: {
          id: true,
          state: true,
          package: {
            select: {
              participantId: true,
              audience: true,
            },
          },
        },
      });

    if (
      !resource ||
      resource.package.participantId !== participant.id ||
      resource.package.audience !== "REPRESENTATIVE" ||
      resource.state !== "RELEASED"
    ) {
      throw new Error("ARP_FIELD_COMMUNICATIONS_CONTEXT_NOT_OWNED");
    }

    return {
      targetType: "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE",
      targetSubtype: "COMMERCIAL_UTILITY_PACK_RESOURCE_RELEASE",
      targetId: resource.id,
    };
  }

  throw new Error("ARP_FIELD_COMMUNICATIONS_CONTEXT_INVALID");
}

function messageKind(type: RepresentativeFieldMessageType) {
  switch (type) {
    case "COMMENT":
      return "TEXT" as const;

    case "REQUEST":
      return "REQUEST" as const;

    case "RESOURCE_COMMENT":
      return "DOCUMENT_REFERENCE" as const;
  }
}

async function ensureTargetLink(params: {
  tx: CommunicationsTransactionClient;
  roomId: string;
  pointer: TargetPointer;
  linkedByUserId: string;
}) {
  const existing = await params.tx.communicationOperationalLink.findUnique({
    where: {
      roomId_targetType_targetSubtype_targetId: {
        roomId: params.roomId,
        targetType: params.pointer.targetType,
        targetSubtype: params.pointer.targetSubtype,
        targetId: params.pointer.targetId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  const link = await params.tx.communicationOperationalLink.create({
    data: {
      roomId: params.roomId,
      targetType: params.pointer.targetType,
      targetSubtype: params.pointer.targetSubtype,
      targetId: params.pointer.targetId,
      linkedByUserId: params.linkedByUserId,
    },
  });

  await params.tx.domainEvent.create({
    data: {
      streamType: "COMMUNICATION_OPERATIONAL_ROOM",
      streamId: params.roomId,
      eventType: COMMUNICATION_EVENT_TYPE.OPERATIONAL_TARGET_LINKED,
      payload: {
        roomId: params.roomId,
        linkId: link.id,
        targetType: link.targetType,
        targetSubtype: link.targetSubtype,
        targetId: link.targetId,
      },
      metadata: {
        actorUserId: params.linkedByUserId,
        source: "ARP_FIELD_COMMUNICATIONS",
      },
      occurredAt: link.linkedAt,
    },
  });

  return link;
}

async function ensureRepresentativeFieldRoom(
  tx: CommunicationsTransactionClient,
  participant: ParticipantRecord,
  operator: { id: string },
  representativeUserId: string,
  actorUserId: string,
) {
  const clientRoomId = roomClientId(participant.id);

  let operationalRoom = await tx.communicationOperationalRoom.findUnique({
    where: {
      createdByUserId_clientRoomId: {
        createdByUserId: operator.id,
        clientRoomId,
      },
    },
    include: {
      conversation: {
        include: {
          members: {
            where: {
              leftAt: null,
            },
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!operationalRoom) {
    const occurredAt = new Date();

    const conversation = await tx.communicationConversation.create({
      data: {
        kind: "GROUP",
        status: "ACTIVE",
        title: `French-Ward Representative Field — ${participant.displayName}`,
        createdByUserId: operator.id,
        members: {
          create: [
            {
              userId: operator.id,
              role: "OWNER",
            },
            {
              userId: representativeUserId,
              role: "MEMBER",
            },
          ],
        },
        operationalRoom: {
          create: {
            clientRoomId,
            requestFingerprint: roomFingerprint({
              participantId: participant.id,
              representativeUserId,
              operatorUserId: operator.id,
            }),
            roomClass: "GENERAL_OPERATIONS",
            createdByUserId: operator.id,
          },
        },
      },
      include: {
        members: {
          where: {
            leftAt: null,
          },
          select: {
            userId: true,
          },
        },
        operationalRoom: true,
      },
    });

    const room = conversation.operationalRoom;

    if (!room) {
      throw new Error("ARP_FIELD_COMMUNICATIONS_ROOM_CREATE_FAILED");
    }

    await tx.domainEvent.create({
      data: {
        streamType: "COMMUNICATION_CONVERSATION",
        streamId: conversation.id,
        eventType: COMMUNICATION_EVENT_TYPE.CONVERSATION_CREATED,
        payload: {
          conversationId: conversation.id,
          kind: conversation.kind,
        },
        metadata: {
          actorUserId,
          institutionalOwnerUserId: operator.id,
          source: "ARP_FIELD_COMMUNICATIONS",
        },
        occurredAt,
      },
    });

    await tx.domainEvent.create({
      data: {
        streamType: "COMMUNICATION_OPERATIONAL_ROOM",
        streamId: room.id,
        eventType: COMMUNICATION_EVENT_TYPE.OPERATIONAL_ROOM_CREATED,
        payload: {
          roomId: room.id,
          conversationId: conversation.id,
          roomClass: room.roomClass,
        },
        metadata: {
          actorUserId,
          institutionalOwnerUserId: operator.id,
          source: "ARP_FIELD_COMMUNICATIONS",
        },
        occurredAt,
      },
    });

    operationalRoom = {
      ...room,
      conversation,
    };
  }

  if (operationalRoom.roomClass !== "GENERAL_OPERATIONS") {
    throw new Error("ARP_FIELD_COMMUNICATIONS_ROOM_TOPOLOGY_CONFLICT");
  }

  const activeMembers = new Set(
    operationalRoom.conversation.members.map(
      (member: { userId: string }) => member.userId,
    ),
  );

  if (
    !activeMembers.has(operator.id) ||
    !activeMembers.has(representativeUserId)
  ) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_MEMBERSHIP_CONFLICT");
  }

  if (operationalRoom.conversation.status !== "ACTIVE") {
    throw new Error("ARP_FIELD_COMMUNICATIONS_ROOM_NOT_WRITABLE");
  }

  const participantPointer: TargetPointer = {
    targetType: "REPRESENTATIVE_PROGRAM_PARTICIPANT",
    targetSubtype: "REPRESENTATIVE_PROGRAM_PARTICIPANT",
    targetId: participant.id,
  };

  await ensureTargetLink({
    tx,
    roomId: operationalRoom.id,
    pointer: participantPointer,
    linkedByUserId: operator.id,
  });

  return operationalRoom;
}

async function performRepresentativeFieldSend(
  client: PrismaClient,
  params: {
    userId: string;
    clientMessageId: string;
    type: RepresentativeFieldMessageType;
    body: string;
    context?: RepresentativeFieldContext | null;
    onMessageCreated?: (tx: Pick<PrismaClient, "emailLog">, id: string) => Promise<unknown>;
  },
) {
  const representativeUserId = normalizeRequired(
    params.userId,
    "ARP_FIELD_COMMUNICATIONS_USER_ID_INVALID",
  );

  const clientMessageId = normalizeRequired(
    params.clientMessageId,
    "ARP_FIELD_COMMUNICATIONS_CLIENT_MESSAGE_ID_INVALID",
    MAX_CLIENT_MESSAGE_ID_LENGTH,
  );

  const body = normalizeRequired(
    params.body,
    "ARP_FIELD_COMMUNICATIONS_MESSAGE_REQUIRED",
    MAX_MESSAGE_LENGTH,
  );

  if (!REPRESENTATIVE_FIELD_MESSAGE_TYPES.includes(params.type)) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_MESSAGE_TYPE_INVALID");
  }

  return client.$transaction(async (tx: CommunicationsTransactionClient) => {
    const participant = await resolveParticipant(tx, representativeUserId);

    const operator = await requireInstitutionalOperator(tx, participant);

    const pointer = await resolveOwnedTarget(tx, participant, params.context);

    const operationalRoom = await ensureRepresentativeFieldRoom(
      tx, participant, operator, representativeUserId, representativeUserId,
    );

    await ensureTargetLink({
      tx,
      roomId: operationalRoom.id,
      pointer,
      linkedByUserId: representativeUserId,
    });

    const kind = messageKind(params.type);

    let sendResult;

    try {
      sendResult =
        await sendMessageInTransactionWithResult({
          tx,
          senderUserId: representativeUserId,
          conversationId: operationalRoom.conversationId,
          clientMessageId,
          kind,
          body,
          workflowReference: {
            targetType: pointer.targetType,
            targetSubtype: pointer.targetSubtype,
            targetId: pointer.targetId,
          },
          eventMetadata: {
            participantId: participant.id,
            source: "ARP_FIELD_COMMUNICATIONS",
          },
        });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "COMMUNICATION_MESSAGE_IDEMPOTENCY_COLLISION"
      ) {
        throw new Error(
          "ARP_FIELD_COMMUNICATIONS_IDEMPOTENCY_COLLISION"
        );
      }

      throw error;
    }

    const {
      message,
      created,
    } = sendResult;

    if (created) {
      await params.onMessageCreated?.(
        { emailLog: tx.emailLog },
        message.id,
      );
    }

    return {
      participant,
      operationalRoomId: operationalRoom.id,
      conversationId: operationalRoom.conversationId,
      message,
      created,
    };
  });
}

export async function sendRepresentativeFieldMessageWithClient(params: {
  client: PrismaClient;
  userId: string;
  clientMessageId: string;
  type: RepresentativeFieldMessageType;
  body: string;
  context?: RepresentativeFieldContext | null;
  onMessageCreated?: (tx: Pick<PrismaClient, "emailLog">, id: string) => Promise<unknown>;
}) {
  try {
    return await performRepresentativeFieldSend(params.client, params);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    /*
     * A concurrent first send may race on the deterministic
     * room/link/message identities. Replay once against the
     * database winner. All material identities are idempotent.
     */
    return performRepresentativeFieldSend(params.client, params);
  }
}

export async function loadRepresentativeFieldCommunicationsWithClient(params: {
  client: PrismaClient;
  userId: string;
  take?: number;
}) {
  const participant = await resolveParticipant(params.client, params.userId);

  const operator = await requireInstitutionalOperator(
    params.client,
    participant,
  );

  const take = Math.max(1, Math.min(params.take ?? 100, 200));

  const room = await params.client.communicationOperationalRoom.findUnique({
    where: {
      createdByUserId_clientRoomId: {
        createdByUserId: operator.id,
        clientRoomId: roomClientId(participant.id),
      },
    },
    include: {
      links: {
        orderBy: {
          linkedAt: "asc",
        },
      },
      conversation: {
        include: {
          members: {
            where: {
              leftAt: null,
            },
            select: {
              userId: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    return {
      participant: {
        id: participant.id,
        docketReference: participant.docketReference,
        displayName: participant.displayName,
      },
      room: null,
      messages: [],
    };
  }

  if (
    room.roomClass !== "GENERAL_OPERATIONS" ||
    room.conversation.status !== "ACTIVE"
  ) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_ROOM_TOPOLOGY_CONFLICT");
  }

  const activeMembers = new Set(
    room.conversation.members.map(
      (member: { userId: string }) => member.userId,
    ),
  );

  if (
    !activeMembers.has(operator.id) ||
    !activeMembers.has(participant.userId!)
  ) {
    throw new Error("ARP_FIELD_COMMUNICATIONS_MEMBERSHIP_CONFLICT");
  }

  const timeline =
    await loadConversationTimelineForMemberWithClient({
      client: params.client,
      userId: params.userId,
      conversationId: room.conversationId,
      messageLimit: take,
      reflectionLimit: take,
    });

  const messageItems =
    timeline.items.filter(
      (
        item,
      ): item is CommunicationTimelineMessageItem =>
        item.itemType === "MESSAGE",
    );

  const senderUserIds = [
    ...new Set(
      messageItems.map(
        (item) => item.message.senderUserId,
      ),
    ),
  ];

  const senderRecords: FieldSenderRecord[] =
    senderUserIds.length > 0
      ? await params.client.user.findMany({
          where: {
            id: {
              in: senderUserIds,
            },
          },
          select: {
            id: true,
            displayName: true,
            name: true,
            email: true,
          },
        })
      : [];

  const senderByUserId =
    new Map<string, FieldSenderRecord>(
      senderRecords.map(
        (sender: FieldSenderRecord) => [
          sender.id,
          sender,
        ] as const,
      ),
    );

  const messages =
    messageItems.map((item) => {
      const message =
        item.message;

      const sender =
        senderByUserId.get(
          message.senderUserId,
        );

      return {
        id: message.id,
        kind: message.kind,
        body: message.body,
        createdAt: message.createdAt,
        sender: {
          role:
            message.senderUserId ===
            participant.userId
              ? ("REPRESENTATIVE" as const)
              : ("FRENCH_WARD" as const),
          displayName:
            sender?.displayName ??
            sender?.name ??
            (
              message.senderUserId ===
              participant.userId
                ? participant.displayName
                : "French-Ward"
            ),
        },
        context:
          message.workflowTargetType &&
          message.workflowTargetSubtype &&
          message.workflowTargetId
            ? {
                targetType:
                  message.workflowTargetType,
                targetSubtype:
                  message.workflowTargetSubtype,
                targetId:
                  message.workflowTargetId,
              }
            : null,
      };
    });

  const messageById =
    new Map(
      messages.map(
        (message) => [
          message.id,
          message,
        ] as const,
      ),
    );

  return {
    participant: {
      id: participant.id,
      docketReference: participant.docketReference,
      displayName: participant.displayName,
    },
    room: {
      id: room.id,
      conversationId: room.conversationId,
      title: room.conversation.title,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      links: room.links.map(
        (link: {
          targetType: string;
          targetSubtype: string;
          targetId: string;
          linkedAt: Date;
        }) => ({
          targetType: link.targetType,
          targetSubtype: link.targetSubtype,
          targetId: link.targetId,
          linkedAt: link.linkedAt,
        }),
      ),
    },
    messages,
    timeline: {
      conversationId:
        timeline.conversationId,
      messageCount:
        timeline.messageCount,
      reflectionCount:
        timeline.reflectionCount,
      items:
        timeline.items.map(
          (item) => {
            if (
              item.itemType ===
              "MESSAGE"
            ) {
              const message =
                messageById.get(
                  item.message.id,
                );

              if (!message) {
                throw new Error(
                  "ARP_FIELD_COMMUNICATIONS_TIMELINE_MESSAGE_MISSING",
                );
              }

              return {
                itemType:
                  "MESSAGE" as const,
                id:
                  item.id,
                occurredAt:
                  item.occurredAt,
                message,
              };
            }

            return {
              itemType:
                "INSTITUTIONAL_REFLECTION" as const,
              id:
                item.id,
              occurredAt:
                item.occurredAt,
              reflection:
                item.reflection,
            };
          },
        ),
    },
  };
}

export async function markRepresentativeFieldReadWithClient(params: {
  client: PrismaClient;
  userId: string;
  throughMessageId: string;
}) {
  const throughMessageId =
    normalizeRequired(
      params.throughMessageId,
      "ARP_FIELD_READ_MESSAGE_ID_INVALID",
    );

  const participant =
    await resolveParticipant(
      params.client,
      params.userId,
    );

  const operator =
    await requireInstitutionalOperator(
      params.client,
      participant,
    );

  const room =
    await params.client.communicationOperationalRoom.findUnique({
      where: {
        createdByUserId_clientRoomId: {
          createdByUserId:
            operator.id,
          clientRoomId:
            roomClientId(
              participant.id,
            ),
        },
      },
      include: {
        conversation: {
          include: {
            members: {
              where: {
                leftAt: null,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

  if (!room) {
    throw new Error(
      "ARP_FIELD_COMMUNICATIONS_ROOM_NOT_FOUND",
    );
  }

  if (
    room.roomClass !==
      "GENERAL_OPERATIONS" ||
    room.conversation.status !==
      "ACTIVE"
  ) {
    throw new Error(
      "ARP_FIELD_COMMUNICATIONS_ROOM_TOPOLOGY_CONFLICT",
    );
  }

  const activeMembers =
    new Set(
      room.conversation.members.map(
        (
          member: {
            userId: string;
          },
        ) => member.userId,
      ),
    );

  if (
    !activeMembers.has(
      operator.id,
    ) ||
    !activeMembers.has(
      participant.userId!,
    )
  ) {
    throw new Error(
      "ARP_FIELD_COMMUNICATIONS_MEMBERSHIP_CONFLICT",
    );
  }

  const membership =
    await markConversationReadForMemberWithClient({
      client:
        params.client,
      userId:
        params.userId,
      conversationId:
        room.conversationId,
      throughMessageId,
    });

  return {
    participant: {
      id:
        participant.id,
      docketReference:
        participant.docketReference,
    },
    conversationId:
      room.conversationId,
    lastReadMessageId:
      membership.lastReadMessageId,
    lastReadAt:
      membership.lastReadAt,
  };
}

/** Open the canonical participant room as its institutional operator; sends nothing. */
export async function openAdminRepresentativeFieldRoomWithClient(params: {
  client: PrismaClient;
  participantId: string;
  operatorUserId: string;
}) {
  const participantId = normalizeRequired(params.participantId, "ARP_FIELD_PARTICIPANT_ID_INVALID");
  const operatorUserId = normalizeRequired(params.operatorUserId, "ARP_FIELD_OPERATOR_ID_INVALID");
  async function perform() {
    return params.client.$transaction(async (tx: CommunicationsTransactionClient) => {
      const bound: ParticipantRecord | null = await tx.representativeProgramParticipant.findUnique({
        where: { id: participantId },
        select: { id: true, docketReference: true, displayName: true, userId: true, createdByUserId: true },
      });
      if (!bound?.userId || bound.createdByUserId !== operatorUserId) {
        throw new Error("ARP_FIELD_OPERATOR_ACCESS_DENIED");
      }
      const participant = await resolveParticipant(tx, bound.userId);
      if (participant.id !== participantId || participant.createdByUserId !== operatorUserId) {
        throw new Error("ARP_FIELD_OPERATOR_ACCESS_DENIED");
      }
      const operator = await requireInstitutionalOperator(tx, participant);
      if (operator.id === bound.userId) throw new Error("ARP_FIELD_COMMUNICATIONS_IDENTITY_CONFLICT");
      const room = await ensureRepresentativeFieldRoom(tx, participant, operator, bound.userId, operatorUserId);
      return { conversationId: room.conversationId };
    }, { maxWait: 10_000, timeout: 30_000 });
  }
  try { return await perform(); }
  catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return perform();
  }
}
