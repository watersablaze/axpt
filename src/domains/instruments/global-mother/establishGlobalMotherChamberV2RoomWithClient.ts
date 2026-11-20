import type { Principal } from "@/domains/auth/types";
import {
  createOperationalRoomInTransaction,
} from "@/domains/communications/operational-rooms/createOperationalRoomWithClient";
import type {
  CommunicationsDatabaseClient,
  CommunicationsTransactionClient,
} from "@/domains/communications/shared/databaseTypes";
import {
  globalMotherCycleV2Plan,
} from "@/domains/instruments/definitions/globalMotherCycleV2Plan";

const MIN_BINDING_REASON_LENGTH = 8;
const MAX_BINDING_REASON_LENGTH = 1000;

function isUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function normalizeBindingReason(
  value: string,
): string {
  const reason = value.trim();

  if (
    reason.length < MIN_BINDING_REASON_LENGTH ||
    reason.length > MAX_BINDING_REASON_LENGTH
  ) {
    throw new Error(
      "GM_CHAMBER_V2_ROOM_BINDING_REASON_INVALID",
    );
  }

  return reason;
}

export async function establishGlobalMotherChamberV2RoomInTransaction(params: {
  tx: CommunicationsTransactionClient;
  principal: Principal;
  bindingReason: string;
}) {
  const {
    tx,
    principal,
    bindingReason,
  } = params;

  const plan = globalMotherCycleV2Plan;
  const communications = plan.communications;

  /*
   * Chamber establishment is an administrative governance
   * action in addition to the Communications room-create
   * permission enforced by the Communications command.
   */
  const operator = await tx.user.findUnique({
    where: {
      id: principal.userId,
    },
    select: {
      id: true,
      isAdmin: true,
    },
  });

  if (!operator?.isAdmin) {
    throw new Error(
      "GM_CHAMBER_V2_OPERATOR_NOT_AUTHORIZED",
    );
  }

  const instrument =
    await tx.institutionalInstrument.findUnique({
      where: {
        reference:
          plan.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
        kind: true,
      },
    });

  if (
    !instrument ||
    instrument.kind !==
      "ROYAL_CUSTODIAL_FRAMEWORK"
  ) {
    throw new Error(
      "GM_CHAMBER_V2_INSTRUMENT_NOT_FOUND",
    );
  }

  /*
   * Durable binding is authoritative. A revoked, prepared,
   * mismatched or differently asserted binding is never
   * repaired silently.
   */
  const existingBinding =
    await tx.globalMotherChamberRoomBinding.findUnique({
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
          include: {
            conversation:
              true,
          },
        },
      },
    });

  if (existingBinding) {
    const room =
      existingBinding.operationalRoom;

    if (
      existingBinding.standing !== "BOUND" ||
      !room ||
      room.clientRoomId !==
        communications.clientRoomId ||
      room.roomClass !==
        communications.roomClass ||
      room.conversation.title !==
        communications.label ||
      room.conversation.status !==
        "ACTIVE"
    ) {
      throw new Error(
        "GM_CHAMBER_V2_ROOM_BINDING_CONFLICT",
      );
    }

    if (
      existingBinding.boundByUserId !==
        principal.userId ||
      existingBinding.bindingReason !==
        bindingReason
    ) {
      throw new Error(
        "GM_CHAMBER_V2_ROOM_BINDING_IDEMPOTENCY_COLLISION",
      );
    }

    return {
      instrument,
      room,
      conversation:
        room.conversation,
      binding:
        existingBinding,
      created:
        false,
    } as const;
  }

  /*
   * clientRoomId alone is not canonical authority, but a
   * pre-existing room with that identifier must be resolved
   * before creation so we never manufacture an ambiguous
   * Chamber topology across different room creators.
   */
  const roomsWithPlannedClientId =
    await tx.communicationOperationalRoom.findMany({
      where: {
        clientRoomId:
          communications.clientRoomId,
      },
      select: {
        id: true,
        createdByUserId: true,
      },
      orderBy: {
        createdAt:
          "asc",
      },
    });

  if (
    roomsWithPlannedClientId.length >
    1
  ) {
    throw new Error(
      "GM_CHAMBER_V2_ROOM_AMBIGUOUS",
    );
  }

  const preexistingRoom =
    roomsWithPlannedClientId[0];

  if (
    preexistingRoom &&
    preexistingRoom.createdByUserId !==
      principal.userId
  ) {
    throw new Error(
      "GM_CHAMBER_V2_ROOM_CREATOR_CONFLICT",
    );
  }

  /*
   * No V1 grants or planned participants are converted into
   * Communications membership here. Chamber admissions and
   * room membership remain separately governed.
   */
  const roomResult =
    await createOperationalRoomInTransaction({
      tx,
      principal,
      clientRoomId:
        communications.clientRoomId,
      title:
        communications.label,
      roomClass:
        communications.roomClass,
      memberUserIds:
        [],
    });

  if (
    roomResult.room.clientRoomId !==
      communications.clientRoomId ||
    roomResult.room.roomClass !==
      communications.roomClass ||
    roomResult.conversation.title !==
      communications.label ||
    roomResult.conversation.status !==
      "ACTIVE"
  ) {
    throw new Error(
      "GM_CHAMBER_V2_ROOM_TOPOLOGY_CONFLICT",
    );
  }

  const boundAt =
    new Date();

  const binding =
    await tx.globalMotherChamberRoomBinding.create({
      data: {
        instrumentReference:
          plan.instrumentReference,
        cycleLabel:
          plan.cycleLabel,
        operationalRoomId:
          roomResult.room.id,
        standing:
          "BOUND",
        boundByUserId:
          principal.userId,
        boundAt,
        bindingReason,
      },
    });

  return {
    instrument,
    room:
      roomResult.room,
    conversation:
      roomResult.conversation,
    binding,
    created:
      true,
  } as const;
}

export async function establishGlobalMotherChamberV2RoomWithClient(
  params: {
    client: CommunicationsDatabaseClient;
    principal: Principal;
    bindingReason: string;
  },
) {
  const bindingReason =
    normalizeBindingReason(
      params.bindingReason,
    );

  async function perform() {
    return params.client.$transaction(
      async (
        tx: CommunicationsTransactionClient,
      ) =>
        establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            params.principal,
          bindingReason,
        }),
      {
        maxWait:
          10_000,
        timeout:
          30_000,
      },
    );
  }

  try {
    return await perform();
  } catch (error) {
    /*
     * A concurrent identical establishment may race on either
     * the Communications room identity or the cycle binding.
     * Replay once; exact durable state is idempotent and any
     * mismatch is rejected by establishInTransaction.
     */
    if (
      !isUniqueConstraintError(
        error,
      )
    ) {
      throw error;
    }

    return perform();
  }
}
