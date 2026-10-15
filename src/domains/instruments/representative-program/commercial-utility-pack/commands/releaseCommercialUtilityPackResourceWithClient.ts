import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE,
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
  assertCommercialUtilityPackResourceTransition,
} from "../contracts";

export type CommercialUtilityPackResourceReleaseClient =
  Pick<
    PrismaClient,
    | "user"
    | "commercialUtilityPackModuleRelease"
    | "commercialUtilityPackResourceRelease"
    | "domainEvent"
  >;

export async function releaseCommercialUtilityPackResourceWithClient(
  params: {
    client:
      CommercialUtilityPackResourceReleaseClient;
    resourceReleaseId: string;
    actorUserId: string;
    occurredAt?: Date;
    // Supplied only by the reviewed-additions application inside its transaction.
    releasedModuleReview?: { id: string; updatedAt: Date };
  },
) {
  const resourceReleaseId =
    params.resourceReleaseId.trim();

  const actorUserId =
    params.actorUserId.trim();

  const occurredAt =
    params.occurredAt ?? new Date();

  if (
    !resourceReleaseId ||
    !actorUserId ||
    !Number.isFinite(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "[CUP_RESOURCE_RELEASE_INPUT_INVALID]",
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
      "[CUP_RESOURCE_RELEASE_ADMIN_REQUIRED]",
    );
  }

  const resource =
    await params.client
      .commercialUtilityPackResourceRelease
      .findUnique({
        where: {
          id:
            resourceReleaseId,
        },
      });

  if (!resource) {
    throw new Error(
      `[CUP_RESOURCE_RELEASE_NOT_FOUND] ${resourceReleaseId}`,
    );
  }

  if (
    resource.state ===
    COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
      .RELEASED
  ) {
    return {
      resource,
      released: false,
    } as const;
  }

  const moduleRelease =
    await params.client
      .commercialUtilityPackModuleRelease
      .findUnique({
        where: {
          packageId_module: {
            packageId:
              resource.packageId,
            module:
              resource.module,
          },
        },
        select: {
          id: true,
          state: true,
          updatedAt: true,
        },
      });

  if (!moduleRelease) {
    throw new Error(
      "[CUP_RESOURCE_RELEASE_MODULE_NOT_FOUND]",
    );
  }

  if (
    moduleRelease.state !== COMMERCIAL_UTILITY_PACK_MODULE_STATE.READY &&
    !(moduleRelease.state === COMMERCIAL_UTILITY_PACK_MODULE_STATE.RELEASED &&
      params.releasedModuleReview !== undefined &&
      params.releasedModuleReview.id === moduleRelease.id &&
      params.releasedModuleReview.updatedAt.getTime() === moduleRelease.updatedAt.getTime())
  ) {
    throw new Error(
      `[CUP_RESOURCE_RELEASE_MODULE_NOT_READY] ${moduleRelease.state}`,
    );
  }

  assertCommercialUtilityPackResourceTransition({
    from:
      resource.state,
    to:
      COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
        .RELEASED,
  });

  const updated =
    await params.client
      .commercialUtilityPackResourceRelease
      .updateMany({
        where: {
          id:
            resource.id,
          state:
            resource.state,
        },
        data: {
          state:
            COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
              .RELEASED,
          releasedByUserId:
            actorUserId,
          releasedAt:
            occurredAt,
        },
      });

  if (updated.count !== 1) {
    throw new Error(
      "[CUP_RESOURCE_RELEASE_CONCURRENT_STATE_CHANGE]",
    );
  }

  await params.client.domainEvent.create({
    data: {
      streamType:
        COMMERCIAL_UTILITY_PACK_STREAM_TYPE,
      streamId:
        resource.packageId,
      eventType:
        COMMERCIAL_UTILITY_PACK_EVENT_TYPE_RELEASE
          .RESOURCE_RELEASED,
      payload: {
        resourceReleaseId:
          resource.id,
        module:
          resource.module,
        resourceType:
          resource.resourceType,
        resourceId:
          resource.resourceId,
      },
      metadata: {
        actorUserId,
        source:
          "representative-program.commercial-utility-pack.resource-release",
      },
      occurredAt,
    },
  });

  const released =
    await params.client
      .commercialUtilityPackResourceRelease
      .findUnique({
        where: {
          id:
            resource.id,
        },
      });

  if (!released) {
    throw new Error(
      "[CUP_RESOURCE_RELEASE_POST_UPDATE_MISSING]",
    );
  }

  return {
    resource:
      released,
    released: true,
  } as const;
}
