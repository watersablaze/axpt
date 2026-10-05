import type {
  PrismaClient,
} from "@prisma/client";

import {
  COMMERCIAL_UTILITY_PACK_MODULES,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackResourceState,
  type CommercialUtilityPackResourceType,
} from "../contracts";

import {
  toCommercialUtilityPackResourceIdentity,
} from "./contracts";

import {
  COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY,
  COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON,
  type CommercialUtilityPackCompositionPlan,
  type CommercialUtilityPackCompositionUnavailableReason,
} from "./resolveCommercialUtilityPackCompositionPlanWithClient";

export const COMMERCIAL_UTILITY_PACK_READINESS = {
  ELIGIBLE:
    "ELIGIBLE",

  BLOCKED:
    "BLOCKED",
} as const;

export type CommercialUtilityPackReadiness =
  (typeof COMMERCIAL_UTILITY_PACK_READINESS)[keyof typeof COMMERCIAL_UTILITY_PACK_READINESS];

export const COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER = {
  REQUIRED_SOURCE_UNAVAILABLE:
    "REQUIRED_SOURCE_UNAVAILABLE",

  EXPECTED_RESOURCE_NOT_REGISTERED:
    "EXPECTED_RESOURCE_NOT_REGISTERED",

  UNPLANNED_CURRENT_RESOURCE:
    "UNPLANNED_CURRENT_RESOURCE",

  NO_REQUIRED_RESOURCE:
    "NO_REQUIRED_RESOURCE",
} as const;

export type CommercialUtilityPackReadinessBlocker =
  (typeof COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER)[keyof typeof COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER];

export type CommercialUtilityPackModuleReadinessAssessment =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    readiness:
      CommercialUtilityPackReadiness;

    expectedResourceCount:
      number;

    currentResourceCount:
      number;

    missingResourceIds:
      readonly string[];

    unplannedResourceIds:
      readonly string[];

    blockingUnavailableReasons:
      readonly CommercialUtilityPackCompositionUnavailableReason[];

    nonBlockingUnavailableReasons:
      readonly CommercialUtilityPackCompositionUnavailableReason[];

    blockers:
      readonly CommercialUtilityPackReadinessBlocker[];
  }>;

export type CommercialUtilityPackReadinessAssessment =
  Readonly<{
    packageId:
      string;

    participantId:
      string;

    modules:
      readonly CommercialUtilityPackModuleReadinessAssessment[];

    eligibleModules:
      readonly CommercialUtilityPackModule[];

    blockedModules:
      readonly CommercialUtilityPackModule[];
  }>;

export type CommercialUtilityPackReadinessAssessmentClient =
  Pick<
    PrismaClient,
    | "commercialUtilityPack"
    | "commercialUtilityPackResourceRelease"
  >;

type CommercialUtilityPackReadinessModuleRecord =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    state:
      string;
  }>;

type CommercialUtilityPackReadinessResourceRecord =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    resourceType:
      CommercialUtilityPackResourceType;

    resourceId:
      string;

    state:
      CommercialUtilityPackResourceState;
  }>;

/**
 * SOURCE_AUTHORITY_NOT_SELECTED is deliberately non-blocking.
 *
 * Source Authority is conditional composition: it becomes required when
 * explicitly selected and therefore AVAILABLE in the current plan.
 *
 * Master Agreement absence and non-current Commercial Parameters are
 * blocking because those entries represent missing canonical requirements
 * for their respective modules.
 */
function unavailableReasonBlocksReadiness(
  reason:
    CommercialUtilityPackCompositionUnavailableReason,
): boolean {
  switch (reason) {
    case COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
      .SOURCE_AUTHORITY_NOT_SELECTED:
      return false;

    case COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
      .MASTER_AGREEMENT_ABSENT:

    case COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
      .COMMERCIAL_PARAMETERS_NOT_CURRENT:
      return true;
  }
}

/**
 * Assess whether each CUP module is governance-complete enough to enter READY.
 *
 * READ ONLY.
 *
 * READY means more than "one current resource exists":
 *
 * - every AVAILABLE descriptor in the current plan is registered;
 * - no blocking canonical source is unavailable;
 * - no unplanned current resource exists;
 * - at least one required resource exists.
 *
 * This function does not:
 * - transition a module;
 * - release a resource;
 * - reconcile package state;
 * - infer representative authority;
 * - change resource permissions.
 */
export async function assessCommercialUtilityPackReadinessWithClient(
  params: Readonly<{
    client:
      CommercialUtilityPackReadinessAssessmentClient;

    packageId:
      string;

    plan:
      CommercialUtilityPackCompositionPlan;
  }>,
): Promise<
  CommercialUtilityPackReadinessAssessment
> {
  const packageId =
    params.packageId.trim();

  const participantId =
    params.plan.participantId.trim();

  if (!packageId || !participantId) {
    throw new Error(
      "[CUP_READINESS_ASSESSMENT_INPUT_INVALID]",
    );
  }

  const pack:
    Readonly<{
      id:
        string;

      participantId:
        string;

      modules:
        readonly CommercialUtilityPackReadinessModuleRecord[];
    }> | null =
    await params.client
      .commercialUtilityPack
      .findUnique({
        where: {
          id:
            packageId,
        },

        select: {
          id:
            true,

          participantId:
            true,

          modules: {
            select: {
              module:
                true,

              state:
                true,
            },
          },
        },
      });

  if (!pack) {
    throw new Error(
      `[CUP_READINESS_ASSESSMENT_PACKAGE_NOT_FOUND] ${packageId}`,
    );
  }

  if (
    pack.participantId !==
      participantId
  ) {
    throw new Error(
      "[CUP_READINESS_ASSESSMENT_PARTICIPANT_CONTRADICTION]",
    );
  }

  if (
    pack.modules.length !==
      COMMERCIAL_UTILITY_PACK_MODULES.length ||
    COMMERCIAL_UTILITY_PACK_MODULES.some(
      (module) =>
        !pack.modules.some(
          (record) =>
            record.module ===
              module,
        ),
    )
  ) {
    throw new Error(
      "[CUP_READINESS_ASSESSMENT_MODULE_REGISTRY_CONTRADICTION]",
    );
  }

  const currentResources:
    readonly CommercialUtilityPackReadinessResourceRecord[] =
    await params.client
      .commercialUtilityPackResourceRelease
      .findMany({
        where: {
          packageId:
            pack.id,

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
          module:
            true,

          resourceType:
            true,

          resourceId:
            true,

          state:
            true,
        },
      });

  const assessments:
    CommercialUtilityPackModuleReadinessAssessment[] =
    [];

  for (
    const module of
      COMMERCIAL_UTILITY_PACK_MODULES
  ) {
    const modulePlanEntries =
      params.plan.entries.filter(
        (entry) =>
          entry.module ===
            module,
      );

    const expected =
      modulePlanEntries.flatMap(
        (entry) => {
          if (
            entry.availability !==
              COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
                .AVAILABLE ||
            !entry.descriptor
          ) {
            return [];
          }

          const identity =
            toCommercialUtilityPackResourceIdentity(
              entry.descriptor,
            );

          return [{
            resourceType:
              identity.resourceType,

            resourceId:
              identity.resourceId,
          }];
        },
      );

    const unavailableReasons =
      modulePlanEntries.flatMap(
        (entry) =>
          entry.availability ===
            COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
              .UNAVAILABLE &&
          entry.unavailableReason
            ? [entry.unavailableReason]
            : [],
      );

    const blockingUnavailableReasons =
      unavailableReasons.filter(
        unavailableReasonBlocksReadiness,
      );

    const nonBlockingUnavailableReasons =
      unavailableReasons.filter(
        (reason) =>
          !unavailableReasonBlocksReadiness(
            reason,
          ),
      );

    const actual =
      currentResources.filter(
        (resource) =>
          resource.module ===
            module,
      );

    const missingResourceIds =
      expected
        .filter(
          (required) =>
            !actual.some(
              (resource) =>
                resource.resourceType ===
                  required.resourceType &&
                resource.resourceId ===
                  required.resourceId,
            ),
        )
        .map(
          (required) =>
            required.resourceId,
        );

    const unplannedResourceIds =
      actual
        .filter(
          (resource) =>
            !expected.some(
              (required) =>
                required.resourceType ===
                  resource.resourceType &&
                required.resourceId ===
                  resource.resourceId,
            ),
        )
        .map(
          (resource) =>
            resource.resourceId,
        );

    const blockers:
      CommercialUtilityPackReadinessBlocker[] =
      [];

    if (
      blockingUnavailableReasons.length >
        0
    ) {
      blockers.push(
        COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
          .REQUIRED_SOURCE_UNAVAILABLE,
      );
    }

    if (
      expected.length ===
        0
    ) {
      blockers.push(
        COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
          .NO_REQUIRED_RESOURCE,
      );
    }

    if (
      missingResourceIds.length >
        0
    ) {
      blockers.push(
        COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
          .EXPECTED_RESOURCE_NOT_REGISTERED,
      );
    }

    if (
      unplannedResourceIds.length >
        0
    ) {
      blockers.push(
        COMMERCIAL_UTILITY_PACK_READINESS_BLOCKER
          .UNPLANNED_CURRENT_RESOURCE,
      );
    }

    assessments.push({
      module,

      readiness:
        blockers.length === 0
          ? COMMERCIAL_UTILITY_PACK_READINESS
              .ELIGIBLE
          : COMMERCIAL_UTILITY_PACK_READINESS
              .BLOCKED,

      expectedResourceCount:
        expected.length,

      currentResourceCount:
        actual.length,

      missingResourceIds,

      unplannedResourceIds,

      blockingUnavailableReasons,

      nonBlockingUnavailableReasons,

      blockers,
    });
  }

  return {
    packageId:
      pack.id,

    participantId,

    modules:
      assessments,

    eligibleModules:
      assessments
        .filter(
          (assessment) =>
            assessment.readiness ===
              COMMERCIAL_UTILITY_PACK_READINESS
                .ELIGIBLE,
        )
        .map(
          (assessment) =>
            assessment.module,
        ),

    blockedModules:
      assessments
        .filter(
          (assessment) =>
            assessment.readiness ===
              COMMERCIAL_UTILITY_PACK_READINESS
                .BLOCKED,
        )
        .map(
          (assessment) =>
            assessment.module,
        ),
  };
}
