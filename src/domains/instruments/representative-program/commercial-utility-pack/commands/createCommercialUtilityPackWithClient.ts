import type {
  PrismaClient,
} from "@prisma/client";

import {
  isRepresentativeProgramTerminalStanding,
} from "../../contracts";

import {
  COMMERCIAL_UTILITY_PACK_AUDIENCE,
  COMMERCIAL_UTILITY_PACK_EVENT_TYPE,
  COMMERCIAL_UTILITY_PACK_MODULES,
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RELEASE_STATE,
  COMMERCIAL_UTILITY_PACK_STATE,
  COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
  createCommercialUtilityPackReference,
} from "../contracts";

export type CommercialUtilityPackCreationClient =
  Pick<
    PrismaClient,
    | "user"
    | "representativeProgramParticipant"
    | "commercialUtilityPack"
    | "domainEvent"
  >;

type ExistingModule = {
  module: string;
};

function assertCanonicalModuleRegistry(
  modules: readonly ExistingModule[],
): void {
  const actual =
    modules
      .map((entry) => entry.module)
      .sort();

  const expected =
    [...COMMERCIAL_UTILITY_PACK_MODULES]
      .sort();

  if (
    actual.length !== expected.length ||
    actual.some(
      (value, index) =>
        value !== expected[index],
    )
  ) {
    throw new Error(
      "[CUP_MODULE_REGISTRY_CONTRADICTION]",
    );
  }
}

export async function createCommercialUtilityPackWithClient(
  params: {
    client: CommercialUtilityPackCreationClient;
    participantId: string;
    version?: number;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const participantId =
    params.participantId.trim();

  const actorUserId =
    params.actorUserId.trim();

  const version =
    params.version ?? 1;

  const occurredAt =
    params.occurredAt ?? new Date();

  if (
    !participantId ||
    !actorUserId ||
    !Number.isInteger(version) ||
    version < 1 ||
    version > 999 ||
    !Number.isFinite(occurredAt.getTime())
  ) {
    throw new Error(
      "[CUP_CREATION_INPUT_INVALID]",
    );
  }

  const actor =
    await params.client.user.findUnique({
      where: {
        id: actorUserId,
      },
      select: {
        isAdmin: true,
      },
    });

  if (!actor?.isAdmin) {
    throw new Error(
      "[CUP_CREATION_ADMIN_REQUIRED]",
    );
  }

  const participant =
    await params.client
      .representativeProgramParticipant
      .findUnique({
        where: {
          id: participantId,
        },
        select: {
          id: true,
          docketReference: true,
          standing: true,
        },
      });

  if (!participant) {
    throw new Error(
      `[CUP_CREATION_PARTICIPANT_NOT_FOUND] ${participantId}`,
    );
  }

  if (
    isRepresentativeProgramTerminalStanding(
      participant.standing,
    )
  ) {
    throw new Error(
      `[CUP_CREATION_PARTICIPANT_TERMINAL] ${participant.standing}`,
    );
  }

  const reference =
    createCommercialUtilityPackReference({
      docketReference:
        participant.docketReference,
      version,
    });

  const existingByVersion =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          participantId_version: {
            participantId:
              participant.id,
            version,
          },
        },
        include: {
          modules: {
            select: {
              module: true,
            },
          },
        },
      });

  if (existingByVersion) {
    if (
      existingByVersion.reference !==
        reference ||
      existingByVersion.participantId !==
        participant.id ||
      existingByVersion.version !==
        version ||
      existingByVersion.audience !==
        COMMERCIAL_UTILITY_PACK_AUDIENCE
          .REPRESENTATIVE
    ) {
      throw new Error(
        "[CUP_CREATION_IDENTITY_CONTRADICTION]",
      );
    }

    assertCanonicalModuleRegistry(
      existingByVersion.modules,
    );

    return {
      package:
        existingByVersion,
      reference,
      created: false,
    } as const;
  }

  const referenceOwner =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          reference,
        },
        select: {
          id: true,
          participantId: true,
          version: true,
        },
      });

  if (referenceOwner) {
    throw new Error(
      `[CUP_CREATION_REFERENCE_CONFLICT] ${reference}`,
    );
  }

  const pack =
    await params.client
      .commercialUtilityPack
      .create({
        data: {
          reference,
          participantId:
            participant.id,
          version,
          state:
            COMMERCIAL_UTILITY_PACK_STATE
              .PREPARING,
          releaseState:
            COMMERCIAL_UTILITY_PACK_RELEASE_STATE
              .WITHHELD,
          audience:
            COMMERCIAL_UTILITY_PACK_AUDIENCE
              .REPRESENTATIVE,
          createdByUserId:
            actorUserId,

          modules: {
            create:
              COMMERCIAL_UTILITY_PACK_MODULES
                .map((module) => ({
                  module,
                  state:
                    COMMERCIAL_UTILITY_PACK_MODULE_STATE
                      .WITHHELD,
                })),
          },
        },
        include: {
          modules: {
            orderBy: {
              module: "asc",
            },
          },
        },
      });

  assertCanonicalModuleRegistry(
    pack.modules,
  );

  await params.client.domainEvent.create({
    data: {
      streamType:
        COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
      streamId:
        pack.id,
      eventType:
        COMMERCIAL_UTILITY_PACK_EVENT_TYPE
          .CREATED,
      payload: {
        packageId:
          pack.id,
        reference:
          pack.reference,
        participantId:
          participant.id,
        docketReference:
          participant.docketReference,
        version,
        modules:
          COMMERCIAL_UTILITY_PACK_MODULES,
      },
      metadata: {
        actorUserId,
        source:
          "representative-program.commercial-utility-pack.creation",
      },
      occurredAt,
    },
  });

  return {
    package:
      pack,
    reference,
    created: true,
  } as const;
}
