import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackResourceType,
} from "../contracts";

export type CommercialUtilityPackResourceRegistrationClient =
  Pick<
    PrismaClient,
    | "user"
    | "commercialUtilityPack"
    | "commercialUtilityPackResourceRelease"
  >;

export async function registerCommercialUtilityPackResourceWithClient(
  params: {
    client:
      CommercialUtilityPackResourceRegistrationClient;
    packageId: string;
    module: CommercialUtilityPackModule;
    resourceType:
      CommercialUtilityPackResourceType;
    resourceId: string;
    label?: string | null;
    canView?: boolean;
    canDownload?: boolean;
    canPresent?: boolean;
    canTransmit?: boolean;
    actorUserId: string;
  },
) {
  const packageId =
    params.packageId.trim();

  const resourceId =
    params.resourceId.trim();

  const actorUserId =
    params.actorUserId.trim();

  if (
    !packageId ||
    !resourceId ||
    !actorUserId
  ) {
    throw new Error(
      "[CUP_RESOURCE_REGISTRATION_INPUT_INVALID]",
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
      "[CUP_RESOURCE_REGISTRATION_ADMIN_REQUIRED]",
    );
  }

  const pack =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id: packageId,
        },
        include: {
          modules: {
            where: {
              module:
                params.module,
            },
            select: {
              id: true,
              state: true,
            },
          },
        },
      });

  if (!pack) {
    throw new Error(
      `[CUP_RESOURCE_REGISTRATION_PACKAGE_NOT_FOUND] ${packageId}`,
    );
  }

  if (pack.modules.length !== 1) {
    throw new Error(
      "[CUP_RESOURCE_REGISTRATION_MODULE_REGISTRY_CONTRADICTION]",
    );
  }

  const moduleRelease =
    pack.modules[0];

  if (
    moduleRelease.state ===
    COMMERCIAL_UTILITY_PACK_MODULE_STATE
      .RELEASED
  ) {
    throw new Error(
      "[CUP_RESOURCE_REGISTRATION_MODULE_ALREADY_RELEASED]",
    );
  }

  const existing =
    await params.client
      .commercialUtilityPackResourceRelease
      .findUnique({
        where: {
          packageId_module_resourceType_resourceId: {
            packageId:
              pack.id,
            module:
              params.module,
            resourceType:
              params.resourceType,
            resourceId,
          },
        },
      });

  const permissions = {
    canView:
      params.canView ?? true,
    canDownload:
      params.canDownload ?? false,
    canPresent:
      params.canPresent ?? false,
    canTransmit:
      params.canTransmit ?? false,
  };

  if (existing) {
    const same =
      existing.state ===
        COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
          .WITHHELD &&
      existing.label ===
        (params.label ?? null) &&
      existing.canView ===
        permissions.canView &&
      existing.canDownload ===
        permissions.canDownload &&
      existing.canPresent ===
        permissions.canPresent &&
      existing.canTransmit ===
        permissions.canTransmit;

    if (!same) {
      throw new Error(
        "[CUP_RESOURCE_REGISTRATION_CONFLICT]",
      );
    }

    return {
      resource:
        existing,
      created: false,
    } as const;
  }

  const resource =
    await params.client
      .commercialUtilityPackResourceRelease
      .create({
        data: {
          packageId:
            pack.id,
          module:
            params.module,
          resourceType:
            params.resourceType,
          resourceId,
          state:
            COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
              .WITHHELD,
          label:
            params.label ?? null,
          ...permissions,
        },
      });

  return {
    resource,
    created: true,
  } as const;
}
