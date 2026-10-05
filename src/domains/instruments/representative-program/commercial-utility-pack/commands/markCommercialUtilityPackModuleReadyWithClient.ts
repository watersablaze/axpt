import {
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  type CommercialUtilityPackModule,
} from "../contracts";

import {
  COMMERCIAL_UTILITY_PACK_READINESS,
  assessCommercialUtilityPackReadinessWithClient,
  type CommercialUtilityPackReadinessAssessmentClient,
} from "../composition/assessCommercialUtilityPackReadinessWithClient";

import type {
  CommercialUtilityPackCompositionPlan,
} from "../composition/resolveCommercialUtilityPackCompositionPlanWithClient";

import {
  transitionCommercialUtilityPackModuleWithClient,
  type CommercialUtilityPackModuleTransitionClient,
} from "./transitionCommercialUtilityPackModuleWithClient";

export type CommercialUtilityPackReadinessApplicationClient =
  CommercialUtilityPackReadinessAssessmentClient &
  CommercialUtilityPackModuleTransitionClient;

/**
 * Move exactly one CUP module from WITHHELD to READY.
 *
 * Readiness is reassessed immediately before mutation.
 *
 * The caller does not supply a trusted/stale readiness decision.
 * The command derives current eligibility from:
 *
 * - the governed composition plan;
 * - the participant-bound CUP;
 * - current registered resources.
 *
 * The actual state mutation remains delegated to the canonical
 * transitionCommercialUtilityPackModuleWithClient command.
 *
 * This command does not:
 * - release a resource;
 * - release a module;
 * - alter resource permissions;
 * - reconcile package release state;
 * - move multiple modules as a batch.
 */
export async function markCommercialUtilityPackModuleReadyWithClient(
  params: Readonly<{
    client:
      CommercialUtilityPackReadinessApplicationClient;

    packageId:
      string;

    module:
      CommercialUtilityPackModule;

    plan:
      CommercialUtilityPackCompositionPlan;

    actorUserId:
      string;

    occurredAt?:
      Date;
  }>,
) {
  const packageId =
    params.packageId.trim();

  const actorUserId =
    params.actorUserId.trim();

  if (!packageId || !actorUserId) {
    throw new Error(
      "[CUP_READINESS_APPLICATION_INPUT_INVALID]",
    );
  }

  const assessment =
    await assessCommercialUtilityPackReadinessWithClient({
      client:
        params.client,

      packageId,

      plan:
        params.plan,
    });

  const moduleAssessment =
    assessment.modules.find(
      (entry) =>
        entry.module ===
          params.module,
    );

  if (!moduleAssessment) {
    throw new Error(
      "[CUP_READINESS_APPLICATION_MODULE_ASSESSMENT_MISSING]",
    );
  }

  if (
    moduleAssessment.readiness !==
      COMMERCIAL_UTILITY_PACK_READINESS
        .ELIGIBLE
  ) {
    throw new Error(
      `[CUP_READINESS_APPLICATION_MODULE_BLOCKED] ${params.module} blockers=${moduleAssessment.blockers.join(",")}`,
    );
  }

  const transition =
    await transitionCommercialUtilityPackModuleWithClient({
      client:
        params.client,

      packageId,

      module:
        params.module,

      expectedFromState:
        COMMERCIAL_UTILITY_PACK_MODULE_STATE
          .WITHHELD,

      toState:
        COMMERCIAL_UTILITY_PACK_MODULE_STATE
          .READY,

      actorUserId,

      occurredAt:
        params.occurredAt,
    });

  return {
    packageId:
      assessment.packageId,

    participantId:
      assessment.participantId,

    module:
      params.module,

    assessment:
      moduleAssessment,

    moduleRelease:
      transition.module,

    transitioned:
      transition.transitioned,
  } as const;
}
