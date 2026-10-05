import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE,
  COMMERCIAL_UTILITY_PACK_MODULES,
  COMMERCIAL_UTILITY_PACK_RELEASE_STATE,
  COMMERCIAL_UTILITY_PACK_STATE,
  COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
  deriveCommercialUtilityPackReleaseState,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackModuleState,
} from "../contracts";

export type CommercialUtilityPackReleaseReconciliationClient =
  Pick<
    PrismaClient,
    | "commercialUtilityPack"
    | "commercialUtilityPackModuleRelease"
    | "domainEvent"
  >;

export async function reconcileCommercialUtilityPackReleaseStateWithClient(
  params: {
    client:
      CommercialUtilityPackReleaseReconciliationClient;
    packageId: string;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const packageId =
    params.packageId.trim();

  const actorUserId =
    params.actorUserId.trim();

  const occurredAt =
    params.occurredAt ?? new Date();

  if (
    !packageId ||
    !actorUserId ||
    !Number.isFinite(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "[CUP_RELEASE_RECONCILIATION_INPUT_INVALID]",
    );
  }

  const pack =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id: packageId,
        },
      });

  if (!pack) {
    throw new Error(
      `[CUP_RELEASE_RECONCILIATION_PACKAGE_NOT_FOUND] ${packageId}`,
    );
  }

  if (
    pack.state ===
      COMMERCIAL_UTILITY_PACK_STATE
        .SUPERSEDED ||
    pack.state ===
      COMMERCIAL_UTILITY_PACK_STATE
        .WITHDRAWN
  ) {
    throw new Error(
      `[CUP_RELEASE_RECONCILIATION_PACKAGE_TERMINAL] ${pack.state}`,
    );
  }

  const modules: Array<{
    module: CommercialUtilityPackModule;
    state: CommercialUtilityPackModuleState;
  }> =
    await params.client
      .commercialUtilityPackModuleRelease
      .findMany({
        where: {
          packageId:
            pack.id,
        },
        select: {
          module: true,
          state: true,
        },
      });

  if (
    modules.length !==
    COMMERCIAL_UTILITY_PACK_MODULES.length
  ) {
    throw new Error(
      "[CUP_RELEASE_RECONCILIATION_MODULE_REGISTRY_CONTRADICTION]",
    );
  }

  const canonical =
    [...COMMERCIAL_UTILITY_PACK_MODULES]
      .sort();

  const actual =
    modules
      .map((entry) => entry.module)
      .sort();

  if (
    actual.some(
      (module, index) =>
        module !== canonical[index],
    )
  ) {
    throw new Error(
      "[CUP_RELEASE_RECONCILIATION_MODULE_REGISTRY_CONTRADICTION]",
    );
  }

  const releaseState =
    deriveCommercialUtilityPackReleaseState(
      modules.map(
        (entry) => entry.state,
      ),
    );

  const fullyReleased =
    releaseState ===
    COMMERCIAL_UTILITY_PACK_RELEASE_STATE
      .RELEASED;

  const nextState =
    fullyReleased
      ? COMMERCIAL_UTILITY_PACK_STATE.CURRENT
      : COMMERCIAL_UTILITY_PACK_STATE.PREPARING;

  if (
    pack.releaseState ===
      releaseState &&
    pack.state ===
      nextState
  ) {
    return {
      package:
        pack,
      changed: false,
    } as const;
  }

  const updated =
    await params.client
      .commercialUtilityPack
      .updateMany({
        where: {
          id:
            pack.id,
          releaseState:
            pack.releaseState,
          state:
            pack.state,
        },
        data: {
          releaseState,
          state:
            nextState,
          releasedByUserId:
            fullyReleased
              ? actorUserId
              : null,
          releasedAt:
            fullyReleased
              ? occurredAt
              : null,
        },
      });

  if (updated.count !== 1) {
    throw new Error(
      "[CUP_RELEASE_RECONCILIATION_CONCURRENT_STATE_CHANGE]",
    );
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
      streamId:
        pack.id,
      eventType:
        fullyReleased
          ? COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE
              .RELEASED
          : COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE
              .RELEASE_STATE_CHANGED,
      payload: {
        fromReleaseState:
          pack.releaseState,
        toReleaseState:
          releaseState,
        fromState:
          pack.state,
        toState:
          nextState,
      },
      metadata: {
        actorUserId,
        source:
          "representative-program.commercial-utility-pack.release-reconciliation",
      },
      occurredAt,
    },
  });

  const reconciled =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id:
            pack.id,
        },
      });

  if (!reconciled) {
    throw new Error(
      "[CUP_RELEASE_RECONCILIATION_POST_UPDATE_MISSING]",
    );
  }

  return {
    package:
      reconciled,
    changed: true,
  } as const;
}
