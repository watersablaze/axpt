import { PrismaClient } from "@prisma/client";

import {
  PERMISSIONS,
} from "@/domains/auth/permissions";
import type {
  Principal,
} from "@/domains/auth/types";
import type {
  CommunicationsTransactionClient,
} from "@/domains/communications/shared/databaseTypes";
import {
  globalMotherCycleV2Plan,
} from "@/domains/instruments/definitions/globalMotherCycleV2Plan";
import {
  establishGlobalMotherChamberV2RoomInTransaction,
} from "@/domains/instruments/global-mother/establishGlobalMotherChamberV2RoomWithClient";

const prisma =
  new PrismaClient();

const ROLLBACK =
  Symbol("GM_CHAMBER_V2_SMOKE_ROLLBACK");

const REASON =
  "Establish the canonical governed communications room for Global Mother Chamber V2.";

function principalFor(
  user: {
    id: string;
    email: string;
  },
): Principal {
  return {
    userId:
      user.id,
    email:
      user.email,
    roles:
      ["ADMIN"],
    permissions: [
      PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
      PERMISSIONS.COMMUNICATIONS_ACCESS,
    ],
  };
}

function requireError(
  error: unknown,
  expected: string,
) {
  if (
    !(error instanceof Error) ||
    error.message !== expected
  ) {
    throw new Error(
      `SMOKE_EXPECTED_ERROR:${expected}:GOT:${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
    );
  }
}

async function rollbackOnly(
  work: (
    tx: CommunicationsTransactionClient,
  ) => Promise<void>,
) {
  let completed =
    false;

  try {
    await prisma.$transaction(
      async (rawTx: CommunicationsTransactionClient) => {
        const tx =
          rawTx as CommunicationsTransactionClient;

        await work(
          tx,
        );

        completed =
          true;

        throw ROLLBACK;
      },
      {
        maxWait:
          10_000,
        timeout:
          30_000,
      },
    );
  } catch (error) {
    if (
      error !== ROLLBACK
    ) {
      throw error;
    }
  }

  if (!completed) {
    throw new Error(
      "SMOKE_ROLLBACK_TRANSACTION_DID_NOT_COMPLETE",
    );
  }
}

async function createForeignRoom(params: {
  tx: CommunicationsTransactionClient;
  creatorUserId: string;
  suffix: string;
}) {
  const plan =
    globalMotherCycleV2Plan;

  return params.tx.communicationConversation.create({
    data: {
      kind:
        "GROUP",
      status:
        "ACTIVE",
      title:
        `${plan.communications.label} · ${params.suffix}`,
      createdByUserId:
        params.creatorUserId,

      members: {
        create: {
          userId:
            params.creatorUserId,
          role:
            "OWNER",
        },
      },

      operationalRoom: {
        create: {
          clientRoomId:
            plan.communications.clientRoomId,
          requestFingerprint:
            `gm-v2-smoke-${params.suffix}`,
          roomClass:
            plan.communications.roomClass,
          createdByUserId:
            params.creatorUserId,
        },
      },
    },

    include: {
      operationalRoom:
        true,
    },
  });
}

async function main() {
  const plan =
    globalMotherCycleV2Plan;

  const admins =
    await prisma.user.findMany({
      where: {
        isAdmin:
          true,
      },
      orderBy: {
        createdAt:
          "asc",
      },
      select: {
        id:
          true,
        email:
          true,
      },
      take:
        4,
    });

  if (
    admins.length < 3
  ) {
    throw new Error(
      "SMOKE_REQUIRES_THREE_ADMIN_USERS",
    );
  }

  const operator =
    admins[0];

  const operatorPrincipal =
    principalFor(
      operator,
    );

  /*
   * 1. Establish, exact replay, altered reason,
   * unauthorized operator, and zero admissions
   * all inside one rollback-only transaction.
   */
  await rollbackOnly(
    async (tx) => {
      const first =
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            operatorPrincipal,
          bindingReason:
            REASON,
        });

      if (
        first.created !== true ||
        first.binding.standing !== "BOUND" ||
        first.binding.operationalRoomId !==
          first.room.id ||
        first.room.clientRoomId !==
          plan.communications.clientRoomId ||
        first.room.roomClass !==
          plan.communications.roomClass ||
        first.conversation.title !==
          plan.communications.label ||
        first.conversation.status !==
          "ACTIVE"
      ) {
        throw new Error(
          "SMOKE_FIRST_ESTABLISHMENT_INVALID",
        );
      }

      const replay =
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            operatorPrincipal,
          bindingReason:
            REASON,
        });

      if (
        replay.created !== false ||
        replay.binding.id !==
          first.binding.id ||
        replay.room.id !==
          first.room.id ||
        replay.conversation.id !==
          first.conversation.id
      ) {
        throw new Error(
          "SMOKE_EXACT_REPLAY_NOT_IDEMPOTENT",
        );
      }

      try {
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            operatorPrincipal,
          bindingReason:
            `${REASON} Altered`,
        });

        throw new Error(
          "SMOKE_CHANGED_REASON_WAS_ACCEPTED",
        );
      } catch (error) {
        requireError(
          error,
          "GM_CHAMBER_V2_ROOM_BINDING_IDEMPOTENCY_COLLISION",
        );
      }

      const unauthorizedPrincipal: Principal = {
        userId:
          "gm-v2-smoke-unauthorized-user",
        email:
          "gm-v2-smoke-unauthorized@example.invalid",
        roles:
          [],
        permissions: [
          PERMISSIONS.COMMUNICATIONS_GROUP_CREATE,
        ],
      };

      try {
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            unauthorizedPrincipal,
          bindingReason:
            REASON,
        });

        throw new Error(
          "SMOKE_UNAUTHORIZED_OPERATOR_WAS_ACCEPTED",
        );
      } catch (error) {
        requireError(
          error,
          "GM_CHAMBER_V2_OPERATOR_NOT_AUTHORIZED",
        );
      }

      const admissionCount =
        await tx.globalMotherChamberAdmission.count();

      if (
        admissionCount !== 0
      ) {
        throw new Error(
          "SMOKE_ROOM_ESTABLISHMENT_CREATED_ADMISSION",
        );
      }
    },
  );

  /*
   * 2. A physical room carrying the planned clientRoomId
   * but owned by another creator cannot become canonical
   * implicitly.
   */
  await rollbackOnly(
    async (tx) => {
      await createForeignRoom({
        tx,
        creatorUserId:
          admins[1].id,
        suffix:
          "foreign-owner",
      });

      try {
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            operatorPrincipal,
          bindingReason:
            REASON,
        });

        throw new Error(
          "SMOKE_FOREIGN_CREATOR_ROOM_WAS_ACCEPTED",
        );
      } catch (error) {
        requireError(
          error,
          "GM_CHAMBER_V2_ROOM_CREATOR_CONFLICT",
        );
      }
    },
  );

  /*
   * 3. Multiple physical rooms carrying the planned
   * clientRoomId are explicitly ambiguous and withheld.
   */
  await rollbackOnly(
    async (tx) => {
      await createForeignRoom({
        tx,
        creatorUserId:
          admins[1].id,
        suffix:
          "ambiguous-a",
      });

      await createForeignRoom({
        tx,
        creatorUserId:
          admins[2].id,
        suffix:
          "ambiguous-b",
      });

      try {
        await establishGlobalMotherChamberV2RoomInTransaction({
          tx,
          principal:
            operatorPrincipal,
          bindingReason:
            REASON,
        });

        throw new Error(
          "SMOKE_AMBIGUOUS_ROOMS_WERE_ACCEPTED",
        );
      } catch (error) {
        requireError(
          error,
          "GM_CHAMBER_V2_ROOM_AMBIGUOUS",
        );
      }
    },
  );

  /*
   * Every test transaction above deliberately rolled back.
   * Durable database state must still be empty.
   */
  const [
    bindings,
    rooms,
    admissions,
  ] =
    await Promise.all([
      prisma.globalMotherChamberRoomBinding.count(),
      prisma.communicationOperationalRoom.count({
        where: {
          clientRoomId:
            plan.communications.clientRoomId,
        },
      }),
      prisma.globalMotherChamberAdmission.count(),
    ]);

  if (
    bindings !== 0 ||
    rooms !== 0 ||
    admissions !== 0
  ) {
    throw new Error(
      `SMOKE_ROLLBACK_FAILED:${bindings}:${rooms}:${admissions}`,
    );
  }

  console.log(
    "PASS: GM V2 room establishment creates and binds atomically, replays exact state idempotently, rejects changed reason, unauthorized operator, foreign ownership and room ambiguity, creates no admissions, and leaves no durable smoke state.",
  );
}

main()
  .catch(
    (error) => {
      console.error(
        error,
      );
      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
