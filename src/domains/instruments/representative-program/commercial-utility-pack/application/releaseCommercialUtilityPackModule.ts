import {
  COMMERCIAL_UTILITY_PACK_MODULE_STATE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_STATE,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackResourceState,
} from "../contracts";

import {
  reconcileCommercialUtilityPackReleaseStateWithClient,
} from "../commands/reconcileCommercialUtilityPackReleaseStateWithClient";

import {
  releaseCommercialUtilityPackResourceWithClient,
} from "../commands/releaseCommercialUtilityPackResourceWithClient";

import {
  transitionCommercialUtilityPackModuleWithClient,
} from "../commands/transitionCommercialUtilityPackModuleWithClient";

import {
  runCommercialUtilityPackGovernanceTransaction,
  type CommercialUtilityPackGovernanceTransactionRunner,
} from "../governance/runCommercialUtilityPackGovernanceTransaction";

/**
 * Execute one explicit CUP module-release decision.
 *
 * Decision boundary:
 *
 *   READY module
 *     → release every current resource
 *     → transition READY → RELEASED
 *     → reconcile package release state
 *
 * All mutations occur inside ONE canonical CUP governance transaction.
 *
 * Current resources are exactly:
 *
 *   WITHHELD | RELEASED
 *
 * SUPERSEDED and WITHDRAWN records are historical and are therefore
 * excluded from the release decision.
 *
 * The application does not:
 *
 * - alter resource permissions;
 * - release any other module;
 * - create or refresh composition;
 * - deliver material to the representative; or
 * - infer any additional authority.
 *
 * Exact replay of an already RELEASED module performs no duplicate
 * resource or module transition. Package reconciliation is replayed
 * idempotently so derived package state can be confirmed.
 */
export async function releaseCommercialUtilityPackModule(
  params: {
    client:
      CommercialUtilityPackGovernanceTransactionRunner;

    packageId:
      string;

    module:
      CommercialUtilityPackModule;

    actorUserId:
      string;

    occurredAt?:
      Date;
  },
) {
  const packageId =
    params.packageId.trim();

  const actorUserId =
    params.actorUserId.trim();

  const occurredAt =
    params.occurredAt ??
    new Date();

  if (
    !packageId ||
    !actorUserId ||
    !Number.isFinite(
      occurredAt.getTime(),
    )
  ) {
    throw new Error(
      "[CUP_MODULE_RELEASE_APPLICATION_INPUT_INVALID]",
    );
  }

  return runCommercialUtilityPackGovernanceTransaction(
    params.client,

    async (tx) => {
      const moduleRelease =
        await tx
          .commercialUtilityPackModuleRelease
          .findUnique({
            where: {
              packageId_module: {
                packageId,
                module:
                  params.module,
              },
            },
          });

      if (!moduleRelease) {
        throw new Error(
          "[CUP_MODULE_RELEASE_APPLICATION_MODULE_NOT_FOUND]",
        );
      }

      const currentResources:
        Array<{
          id: string;
          state:
            CommercialUtilityPackResourceState;
        }> =
        await tx
          .commercialUtilityPackResourceRelease
          .findMany({
            where: {
              packageId,
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
              id:
                true,

              state:
                true,
            },
          });

      if (
        currentResources.length ===
        0
      ) {
        throw new Error(
          "[CUP_MODULE_RELEASE_APPLICATION_CURRENT_RESOURCE_REQUIRED]",
        );
      }

      /*
       * Exact replay.
       *
       * A RELEASED module must already have all of its current resources
       * RELEASED. Anything else is a canonical contradiction rather than
       * something this application should attempt to repair silently.
       */
      if (
        moduleRelease.state ===
        COMMERCIAL_UTILITY_PACK_MODULE_STATE
          .RELEASED
      ) {
        if (
          currentResources.some(
            (resource) =>
              resource.state !==
              COMMERCIAL_UTILITY_PACK_RESOURCE_STATE
                .RELEASED,
          )
        ) {
          throw new Error(
            "[CUP_MODULE_RELEASE_APPLICATION_RELEASED_MODULE_RESOURCE_CONTRADICTION]",
          );
        }

        const reconciliation =
          await reconcileCommercialUtilityPackReleaseStateWithClient({
            client:
              tx,

            packageId,

            actorUserId,

            occurredAt,
          });

        return {
          packageId,

          module:
            params.module,

          currentResourceCount:
            currentResources.length,

          releasedResourceCount:
            0,

          moduleTransitioned:
            false,

          packageChanged:
            reconciliation.changed,

          package:
            reconciliation.package,
        } as const;
      }

      if (
        moduleRelease.state !==
        COMMERCIAL_UTILITY_PACK_MODULE_STATE
          .READY
      ) {
        throw new Error(
          `[CUP_MODULE_RELEASE_APPLICATION_MODULE_NOT_READY] ${moduleRelease.state}`,
        );
      }

      let releasedResourceCount =
        0;

      /*
       * Release every current resource while the parent module remains READY.
       *
       * The canonical resource command is compare-and-set and exact-target
       * replay safe. A resource already RELEASED contributes no duplicate
       * mutation or event.
       */
      for (
        const resource
        of currentResources
      ) {
        const released =
          await releaseCommercialUtilityPackResourceWithClient({
            client:
              tx,

            resourceReleaseId:
              resource.id,

            actorUserId,

            occurredAt,
          });

        if (
          released.released
        ) {
          releasedResourceCount +=
            1;
        }
      }

      const moduleTransition =
        await transitionCommercialUtilityPackModuleWithClient({
          client:
            tx,

          packageId,

          module:
            params.module,

          expectedFromState:
            COMMERCIAL_UTILITY_PACK_MODULE_STATE
              .READY,

          toState:
            COMMERCIAL_UTILITY_PACK_MODULE_STATE
              .RELEASED,

          actorUserId,

          occurredAt,
        });

      const reconciliation =
        await reconcileCommercialUtilityPackReleaseStateWithClient({
          client:
            tx,

          packageId,

          actorUserId,

          occurredAt,
        });

      return {
        packageId,

        module:
          params.module,

        currentResourceCount:
          currentResources.length,

        releasedResourceCount,

        moduleTransitioned:
          moduleTransition.transitioned,

        packageChanged:
          reconciliation.changed,

        package:
          reconciliation.package,
      } as const;
    },
  );
}
