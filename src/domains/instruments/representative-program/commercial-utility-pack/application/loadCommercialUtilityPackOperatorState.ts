import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_MODULES,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackModuleState,
  type CommercialUtilityPackReleaseState,
  type CommercialUtilityPackResourceState,
} from "../contracts";

export type CommercialUtilityPackOperatorStateClient =
  Pick<
    PrismaClient,
    | "commercialUtilityPack"
  >;

type CommercialUtilityPackOperatorPersistenceModule =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    state:
      CommercialUtilityPackModuleState;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;
  }>;

type CommercialUtilityPackOperatorPersistenceResource =
  Readonly<{
    id:
      string;

    module:
      CommercialUtilityPackModule;

    resourceType:
      string;

    resourceId:
      string;

    label:
      string | null;

    state:
      CommercialUtilityPackResourceState;

    canView:
      boolean;

    canDownload:
      boolean;

    canPresent:
      boolean;

    canTransmit:
      boolean;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;
  }>;

type CommercialUtilityPackOperatorPersistenceRecord =
  Readonly<{
    id:
      string;

    reference:
      string;

    participantId:
      string;

    version:
      number;

    state:
      string;

    releaseState:
      CommercialUtilityPackReleaseState;

    audience:
      string;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;

    modules:
      readonly CommercialUtilityPackOperatorPersistenceModule[];

    resources:
      readonly CommercialUtilityPackOperatorPersistenceResource[];
  }>;

export type CommercialUtilityPackOperatorResourceState =
  Readonly<{
    id:
      string;

    module:
      CommercialUtilityPackModule;

    resourceType:
      string;

    resourceId:
      string;

    label:
      string | null;

    state:
      CommercialUtilityPackResourceState;

    canView:
      boolean;

    canDownload:
      boolean;

    canPresent:
      boolean;

    canTransmit:
      boolean;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;
  }>;

export type CommercialUtilityPackOperatorModuleState =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    state:
      CommercialUtilityPackModuleState;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;

    currentResources:
      readonly CommercialUtilityPackOperatorResourceState[];
  }>;

export type CommercialUtilityPackOperatorState =
  Readonly<{
    id:
      string;

    reference:
      string;

    participantId:
      string;

    version:
      number;

    state:
      string;

    releaseState:
      CommercialUtilityPackReleaseState;

    audience:
      string;

    releasedByUserId:
      string | null;

    releasedAt:
      Date | null;

    modules:
      readonly CommercialUtilityPackOperatorModuleState[];
  }>;

/**
 * Load durable CUP truth for an operator.
 *
 * This is a read model only.
 *
 * It does not:
 * - prepare or refresh composition;
 * - transition module readiness;
 * - release resources;
 * - release modules;
 * - reconcile package state;
 * - derive representative authority; or
 * - create representative delivery.
 *
 * Current resources are WITHHELD | RELEASED.
 * SUPERSEDED and WITHDRAWN records remain historical and are omitted from
 * the operator decision surface.
 */
export async function loadCommercialUtilityPackOperatorState(
  params: Readonly<{
    client:
      CommercialUtilityPackOperatorStateClient;

    participantId:
      string;

    version?:
      number;
  }>,
): Promise<
  CommercialUtilityPackOperatorState | null
> {
  const participantId =
    params.participantId.trim();

  const version =
    params.version ?? 1;

  if (
    !participantId ||
    !Number.isInteger(
      version,
    ) ||
    version < 1 ||
    version > 999
  ) {
    throw new Error(
      "[CUP_OPERATOR_STATE_INPUT_INVALID]",
    );
  }

  const pack:
    CommercialUtilityPackOperatorPersistenceRecord | null =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          participantId_version: {
            participantId,
            version,
          },
        },

        select: {
          id:
            true,

          reference:
            true,

          participantId:
            true,

          version:
            true,

          state:
            true,

          releaseState:
            true,

          audience:
            true,

          releasedByUserId:
            true,

          releasedAt:
            true,

          modules: {
            select: {
              module:
                true,

              state:
                true,

              releasedByUserId:
                true,

              releasedAt:
                true,
            },
          },

          resources: {
            where: {
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
              id:
                true,

              module:
                true,

              resourceType:
                true,

              resourceId:
                true,

              label:
                true,

              state:
                true,

              canView:
                true,

              canDownload:
                true,

              canPresent:
                true,

              canTransmit:
                true,

              releasedByUserId:
                true,

              releasedAt:
                true,
            },
          },
        },
      });

  if (!pack) {
    return null;
  }

  if (
    pack.participantId !==
      participantId
  ) {
    throw new Error(
      "[CUP_OPERATOR_STATE_PARTICIPANT_CONTRADICTION]",
    );
  }

  const canonicalModules =
    [...COMMERCIAL_UTILITY_PACK_MODULES]
      .sort();

  const actualModules =
    pack.modules
      .map(
        (entry) =>
          entry.module,
      )
      .sort();

  if (
    actualModules.length !==
      canonicalModules.length ||
    actualModules.some(
      (module, index) =>
        module !==
        canonicalModules[index],
    )
  ) {
    throw new Error(
      "[CUP_OPERATOR_STATE_MODULE_REGISTRY_CONTRADICTION]",
    );
  }

  const modules =
    COMMERCIAL_UTILITY_PACK_MODULES
      .map(
        (
          module,
        ): CommercialUtilityPackOperatorModuleState => {
          const moduleRecord =
            pack.modules.find(
              (entry) =>
                entry.module ===
                module,
            );

          if (!moduleRecord) {
            throw new Error(
              `[CUP_OPERATOR_STATE_MODULE_MISSING] ${module}`,
            );
          }

          const currentResources =
            pack.resources
              .filter(
                (resource) =>
                  resource.module ===
                  module,
              )
              .map(
                (
                  resource,
                ): CommercialUtilityPackOperatorResourceState => ({
                  id:
                    resource.id,

                  module:
                    resource.module,

                  resourceType:
                    resource.resourceType,

                  resourceId:
                    resource.resourceId,

                  label:
                    resource.label,

                  state:
                    resource.state,

                  canView:
                    resource.canView,

                  canDownload:
                    resource.canDownload,

                  canPresent:
                    resource.canPresent,

                  canTransmit:
                    resource.canTransmit,

                  releasedByUserId:
                    resource.releasedByUserId,

                  releasedAt:
                    resource.releasedAt,
                }),
              );

          return {
            module,

            state:
              moduleRecord.state,

            releasedByUserId:
              moduleRecord.releasedByUserId,

            releasedAt:
              moduleRecord.releasedAt,

            currentResources,
          };
        },
      );

  return {
    id:
      pack.id,

    reference:
      pack.reference,

    participantId:
      pack.participantId,

    version:
      pack.version,

    state:
      pack.state,

    releaseState:
      pack.releaseState,

    audience:
      pack.audience,

    releasedByUserId:
      pack.releasedByUserId,

    releasedAt:
      pack.releasedAt,

    modules,
  };
}
