import {
  COMMERCIAL_UTILITY_PACK_READINESS,
  assessCommercialUtilityPackReadinessWithClient,
} from "../composition/assessCommercialUtilityPackReadinessWithClient";

import {
  resolveCommercialUtilityPackCompositionPlanWithClient,
} from "../composition/resolveCommercialUtilityPackCompositionPlanWithClient";

import {
  markCommercialUtilityPackModuleReadyWithClient,
} from "../commands/markCommercialUtilityPackModuleReadyWithClient";

import {
  registerCommercialUtilityPackCompositionPlanWithClient,
} from "../commands/registerCommercialUtilityPackCompositionPlanWithClient";

import {
  runCommercialUtilityPackGovernanceTransaction,
  type CommercialUtilityPackGovernanceTransactionRunner,
} from "../governance/runCommercialUtilityPackGovernanceTransaction";

/**
 * Apply the current representative-safe composition to an existing CUP.
 *
 * Transaction boundary:
 *
 *   resolve plan
 *   → register AVAILABLE resources
 *   → assess readiness
 *   → move ELIGIBLE modules to READY
 *
 * All persistence mutations occur in one CUP governance transaction.
 *
 * BLOCKED is a valid readiness outcome. A blocked module is reported
 * and left unchanged; it does not roll back other complete modules.
 *
 * Package creation remains outside this application boundary because
 * prepareCommercialUtilityPack owns its own P2002 recovery lifecycle.
 *
 * This application does not:
 * - create a CUP;
 * - manufacture unavailable canonical content;
 * - release resources;
 * - release modules;
 * - change representative-facing permissions;
 * - reconcile package release state.
 */
export async function applyCommercialUtilityPackComposition(
  params: Readonly<{
    client:
      CommercialUtilityPackGovernanceTransactionRunner;

    packageId:
      string;

    participantId:
      string;

    actorUserId:
      string;

    sourceAuthorityInstrumentReference?:
      string | null;

    occurredAt?:
      Date;
  }>,
) {
  const packageId =
    params.packageId.trim();

  const participantId =
    params.participantId.trim();

  const actorUserId =
    params.actorUserId.trim();

  if (
    !packageId ||
    !participantId ||
    !actorUserId ||
    (
      params.occurredAt !== undefined &&
      !Number.isFinite(
        params.occurredAt.getTime(),
      )
    )
  ) {
    throw new Error(
      "[CUP_COMPOSITION_APPLICATION_INPUT_INVALID]",
    );
  }

  const sourceAuthorityInstrumentReference =
    params.sourceAuthorityInstrumentReference
      ?.trim() || null;

  return runCommercialUtilityPackGovernanceTransaction(
    params.client,

    async (tx) => {
      /*
       * Resolve the canonical plan inside the same transaction that will
       * persist and apply it. The caller cannot inject a stale plan.
       */
      const plan =
        await resolveCommercialUtilityPackCompositionPlanWithClient({
          client:
            tx,

          participantId,

          sourceAuthorityInstrumentReference,
        });

      /*
       * Register only AVAILABLE descriptors.
       *
       * The registration command independently proves package ↔ participant
       * binding and validates the entire plan before its first write.
       */
      const registration =
        await registerCommercialUtilityPackCompositionPlanWithClient({
          client:
            tx,

          packageId,

          plan,

          actorUserId,
        });

      /*
       * Establish the complete module picture after registration.
       *
       * BLOCKED is state, not an exception.
       */
      const readiness =
        await assessCommercialUtilityPackReadinessWithClient({
          client:
            tx,

          packageId,

          plan,
        });

      const readinessApplications:
        Array<
          Awaited<
            ReturnType<
              typeof markCommercialUtilityPackModuleReadyWithClient
            >
          >
        > =
        [];

      /*
       * Apply exactly the modules proven ELIGIBLE by the current plan.
       *
       * Each command reassesses its requested module immediately before
       * the canonical WITHHELD → READY transition. This deliberately keeps
       * readiness proof at the mutation boundary.
       */
      for (
        const moduleAssessment of
          readiness.modules
      ) {
        if (
          moduleAssessment.readiness !==
            COMMERCIAL_UTILITY_PACK_READINESS
              .ELIGIBLE
        ) {
          continue;
        }

        const applied =
          await markCommercialUtilityPackModuleReadyWithClient({
            client:
              tx,

            packageId,

            module:
              moduleAssessment.module,

            plan,

            actorUserId,

            occurredAt:
              params.occurredAt,
          });

        readinessApplications.push(
          applied,
        );
      }

      return {
        packageId:
          registration.packageId,

        participantId:
          registration.participantId,

        plan,

        registration,

        readiness,

        readinessApplications,

        eligibleModules:
          readiness.eligibleModules,

        blockedModules:
          readiness.blockedModules,
      } as const;
    },
  );
}
