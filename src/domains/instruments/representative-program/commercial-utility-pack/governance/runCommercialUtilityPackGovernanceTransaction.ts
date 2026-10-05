import type {
  PrismaClient,
} from "@prisma/client";

import type {
  CommercialUtilityPackCreationClient,
} from "../commands/createCommercialUtilityPackWithClient";

import type {
  CommercialUtilityPackCompositionRegistrationClient,
} from "../commands/registerCommercialUtilityPackCompositionPlanWithClient";

import type {
  CommercialUtilityPackReadinessApplicationClient,
} from "../commands/markCommercialUtilityPackModuleReadyWithClient";

import type {
  CommercialUtilityPackCompositionPlanClient,
} from "../composition/resolveCommercialUtilityPackCompositionPlanWithClient";

/**
 * Canonical CUP governance transaction capability surface.
 *
 * One transaction model serves both:
 *
 * - package creation; and
 * - post-creation composition governance.
 *
 * This type grants only the delegate capabilities already demanded by
 * canonical CUP domain operations. It does not introduce new persistence
 * authority.
 */
export type CommercialUtilityPackGovernanceTransactionClient =
  CommercialUtilityPackCreationClient &
  CommercialUtilityPackCompositionPlanClient &
  CommercialUtilityPackCompositionRegistrationClient &
  CommercialUtilityPackReadinessApplicationClient;

export type CommercialUtilityPackGovernanceTransactionRunner =
  Pick<
    PrismaClient,
    "$transaction"
  >;

export async function runCommercialUtilityPackGovernanceTransaction<T>(
  client:
    CommercialUtilityPackGovernanceTransactionRunner,

  operation: (
    tx:
      CommercialUtilityPackGovernanceTransactionClient,
  ) => Promise<T>,
): Promise<T> {
  return client.$transaction(
    async (
      tx:
        CommercialUtilityPackGovernanceTransactionClient,
    ) =>
      operation(
        tx,
      ),
  );
}
