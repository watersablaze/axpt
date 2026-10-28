import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherCycleV2Plan } from "@/domains/instruments/definitions/globalMotherCycleV2Plan";

export type GlobalMotherChamberCommunicationReadModel =
  | {
      standing: "NOT_ESTABLISHED";
      plannedClientRoomId: string;
      plannedRoomClass: string;
    }
  | {
      standing: "AMBIGUOUS";
      plannedClientRoomId: string;
      plannedRoomClass: string;
      roomCount: number;
    }
  | {
      standing: "ESTABLISHED";
      plannedClientRoomId: string;
      plannedRoomClass: string;
      room: {
        id: string;
        conversationId: string;
        title: string | null;
        status: string;
        roomClass: string;
      };
      correspondenceCount: number;
      formalRecordCount: number;
      reflectionCount: number;
      messages: Array<{
        id: string;
        senderUserId: string;
        kind: string;
        body: string;
        createdAt: Date;
        chamberRecord: null | {
          id: string;
          communicationClass: string;
          subject: string;
          authorCapacityKey: string;
          authorCapacityLabel: string;
          addresseeType: string;
          addresseeSnapshot: unknown;
          bodyHash: string;
          enteredIntoRecordAt: Date;
          respondsToRecordId: string | null;
          supersedesRecordId: string | null;
        };
      }>;
      reflections: Array<{
        id: string;
        sourceSystem: string;
        sourceAggregateType: string;
        sourceAggregateId: string;
        sourceEventType: string;
        sourceOccurredAt: Date;
        targetType: string;
        targetSubtype: string;
        targetId: string;
        reflectionType: string;
        reflectionCode: string;
      }>;
    };

export async function loadGlobalMotherChamberCommunicationReadModel(): Promise<GlobalMotherChamberCommunicationReadModel> {
  const plan = globalMotherCycleV2Plan;
  const planned = plan.communications;

  /*
   * Chamber authority is established by the durable
   * instrument + cycle binding, never by clientRoomId
   * discovery alone.
   */
  const binding =
    await prisma.globalMotherChamberRoomBinding.findUnique({
      where: {
        instrumentReference_cycleLabel: {
          instrumentReference:
            plan.instrumentReference,
          cycleLabel:
            plan.cycleLabel,
        },
      },
      include: {
        operationalRoom: {
          select: {
            id: true,
            conversationId: true,
            clientRoomId: true,
            roomClass: true,
            conversation: {
              select: {
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!binding) {
    return {
      standing: "NOT_ESTABLISHED",
      plannedClientRoomId: planned.clientRoomId,
      plannedRoomClass: planned.roomClass,
    };
  }

  const room =
    binding.operationalRoom;

  /*
   * A binding exists but is not an active exact canonical
   * topology. The existing UI contract exposes this as
   * REVIEW REQUIRED / ambiguous rather than fabricating
   * establishment.
   */
  if (
    binding.standing !== "BOUND" ||
    !room ||
    room.clientRoomId !==
      planned.clientRoomId ||
    room.roomClass !==
      planned.roomClass ||
    room.conversation.title !==
      planned.label ||
    room.conversation.status !==
      "ACTIVE"
  ) {
    return {
      standing: "AMBIGUOUS",
      plannedClientRoomId: planned.clientRoomId,
      plannedRoomClass: planned.roomClass,
      roomCount:
        room ? 1 : 0,
    };
  }

  const [messages, reflections] =
    await Promise.all([
      prisma.communicationMessage.findMany({
        where: {
          conversationId:
            room.conversationId,
        },
        orderBy: {
          createdAt:
            "asc",
        },
        select: {
          id: true,
          senderUserId: true,
          kind: true,
          body: true,
          createdAt: true,
          chamberRecord: {
            select: {
              id: true,
              communicationClass:
                true,
              subject:
                true,
              authorCapacityKey:
                true,
              authorCapacityLabel:
                true,
              addresseeType:
                true,
              addresseeSnapshot:
                true,
              bodyHash:
                true,
              enteredIntoRecordAt:
                true,
              respondsToRecordId:
                true,
              supersedesRecordId:
                true,
            },
          },
        },
      }),

      prisma.communicationOperationalReflection.findMany({
        where: {
          operationalRoomId:
            room.id,
        },
        orderBy: {
          sourceOccurredAt:
            "asc",
        },
        select: {
          id: true,
          sourceSystem: true,
          sourceAggregateType:
            true,
          sourceAggregateId:
            true,
          sourceEventType:
            true,
          sourceOccurredAt:
            true,
          targetType:
            true,
          targetSubtype:
            true,
          targetId:
            true,
          reflectionType:
            true,
          reflectionCode:
            true,
        },
      }),
    ]);

  return {
    standing: "ESTABLISHED",
    plannedClientRoomId:
      planned.clientRoomId,
    plannedRoomClass:
      planned.roomClass,
    room: {
      id:
        room.id,
      conversationId:
        room.conversationId,
      title:
        room.conversation.title,
      status:
        room.conversation.status,
      roomClass:
        room.roomClass,
    },
    correspondenceCount:
      messages.filter(
        (
          message: {
            chamberRecord:
              unknown | null;
          },
        ) =>
          !message.chamberRecord,
      ).length,
    formalRecordCount:
      messages.filter(
        (
          message: {
            chamberRecord:
              unknown | null;
          },
        ) =>
          Boolean(
            message.chamberRecord,
          ),
      ).length,
    reflectionCount:
      reflections.length,
    messages,
    reflections,
  };
}
