import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE,
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
  assertCommercialUtilityPackModuleTransition,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackModuleState,
  type CommercialUtilityPackResourceState,
} from "../contracts";

export type CommercialUtilityPackModuleTransitionClient =
  Pick<
    PrismaClient,
    | "user"
    | "commercialUtilityPack"
    | "commercialUtilityPackModuleRelease"
    | "commercialUtilityPackResourceRelease"
    | "domainEvent"
  >;

export async function transitionCommercialUtilityPackModuleWithClient(
  params: {
    client:
      CommercialUtilityPackModuleTransitionClient;
    packageId: string;
    module:
      CommercialUtilityPackModule;
    expectedFromState:
      CommercialUtilityPackModuleState;
    toState:
      CommercialUtilityPackModuleState;
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
      "[CUP_MODULE_TRANSITION_INPUT_INVALID]",
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
      "[CUP_MODULE_TRANSITION_ADMIN_REQUIRED]",
    );
  }

  const pack =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id: packageId,
        },
        select: {
          id: true,
          state: true,
        },
      });

  if (!pack) {
    throw new Error(
      `[CUP_MODULE_TRANSITION_PACKAGE_NOT_FOUND] ${packageId}`,
    );
  }

  const module =
    await params.client
      .commercialUtilityPackModuleRelease
      .findUnique({
        where: {
          packageId_module: {
            packageId:
              pack.id,
            module:
              params.module,
          },
        },
      });

  if (!module) {
    throw new Error(
      "[CUP_MODULE_TRANSITION_MODULE_NOT_FOUND]",
    );
  }

  if (
    module.state ===
    params.toState
  ) {
    return {
      module,
      transitioned: false,
    } as const;
  }

  if (
    module.state !==
    params.expectedFromState
  ) {
    throw new Error(
      `[CUP_MODULE_TRANSITION_STATE_MISMATCH] expected=${params.expectedFromState} actual=${module.state}`,
    );
  }

  assertCommercialUtilityPackModuleTransition({
    from:
      module.state,
    to:
      params.toState,
  });

  const resources: Array<{
    id: string;
    state: CommercialUtilityPackResourceState;
  }> =
    await params.client
      .commercialUtilityPackResourceRelease
      .findMany({
        where: {
          packageId:
            pack.id,
          module:
            params.module,
          state: {
            in: [
              COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
                .WITHHELD,
              COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
                .RELEASED,
            ],
          },
        },
        select: {
          id: true,
          state: true,
        },
      });

  if (
    params.toState ===
      COMMERCIAL_UTILITY_PACK_MODULE_STATE
        .READY &&
    resources.length === 0
  ) {
    throw new Error(
      "[CUP_MODULE_READY_REQUIRES_CURRENT_RESOURCE]",
    );
  }

  if (
    params.toState ===
      COMMERCIAL_UTILITY_PACK_MODULE_STATE
        .RELEASED &&
    (
      resources.length === 0 ||
      resources.some(
        (resource) =>
          resource.state !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
            .RELEASED,
      )
    )
  ) {
    throw new Error(
      "[CUP_MODULE_RELEASE_REQUIRES_ALL_CURRENT_RESOURCES_RELEASED]",
    );
  }

  const updated =
    await params.client
      .commercialUtilityPackModuleRelease
      .updateMany({
        where: {
          id:
            module.id,
          state:
            params.expectedFromState,
        },
        data: {
          state:
            params.toState,
          releasedByUserId:
            params.toState ===
            COMMERCIAL_UTILITY_PACK_MODULE_STATE
              .RELEASED
              ? actorUserId
              : null,
          releasedAt:
            params.toState ===
            COMMERCIAL_UTILITY_PACK_MODULE_STATE
              .RELEASED
              ? occurredAt
              : null,
        },
      });

  if (updated.count !== 1) {
    throw new Error(
      "[CUP_MODULE_TRANSITION_CONCURRENT_STATE_CHANGE]",
    );
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
      streamId:
        pack.id,
      eventType:
        COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE
          .MODULE_STATE_CHANGED,
      payload: {
        module:
          params.module,
        fromState:
          params.expectedFromState,
        toState:
          params.toState,
      },
      metadata: {
        actorUserId,
        source:
          "representative-program.commercial-utility-pack.module-transition",
      },
      occurredAt,
    },
  });

  const transitioned =
    await params.client
      .commercialUtilityPackModuleRelease
      .findUnique({
        where: {
          id:
            module.id,
        },
      });

  if (!transitioned) {
    throw new Error(
      "[CUP_MODULE_TRANSITION_POST_UPDATE_MISSING]",
    );
  }

  return {
    module:
      transitioned,
    transitioned: true,
  } as const;
}
