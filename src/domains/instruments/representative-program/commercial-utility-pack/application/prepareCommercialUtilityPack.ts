import type {
  PrismaClient,
} from "@prisma/client";

import {
  createCommercialUtilityPackWithClient,
} from "../commands/createCommercialUtilityPackWithClient";

import {
  runCommercialUtilityPackGovernanceTransaction,
} from "../governance/runCommercialUtilityPackGovernanceTransaction";

type CommercialUtilityPackPreparationRunner =
  Pick<
    PrismaClient,
    "$transaction"
  >;

function isPrismaUniqueConstraintError(
  error: unknown,
): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as {
      code?: unknown;
    }).code === "P2002"
  );
}

/**
 * Prepare a representative Commercial Utility Pack.
 *
 * Exact replay is resolved semantically by the creation command.
 *
 * Concurrent duplicate creation is resolved here, outside the failed
 * transaction boundary:
 *
 * 1. first transaction attempts creation;
 * 2. a uniqueness collision rolls that transaction back;
 * 3. a fresh transaction reruns the canonical semantic lookup;
 * 4. the committed package is returned with created=false.
 *
 * Only Prisma P2002 receives this recovery path. All other failures
 * propagate unchanged.
 */
export async function prepareCommercialUtilityPack(
  params: {
    client:
      CommercialUtilityPackPreparationRunner;
    participantId: string;
    version?: number;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const execute = () =>
    runCommercialUtilityPackGovernanceTransaction(
      params.client,
      (tx) =>
        createCommercialUtilityPackWithClient({
          client: tx,
          participantId:
            params.participantId,
          version:
            params.version,
          actorUserId:
            params.actorUserId,
          occurredAt:
            params.occurredAt,
        }),
    );

  try {
    return await execute();
  } catch (error) {
    if (
      !isPrismaUniqueConstraintError(
        error,
      )
    ) {
      throw error;
    }

    /*
     * Do not reuse the failed transaction.
     * The second execution obtains a fresh transaction and must
     * resolve the now-committed canonical CUP semantically.
     */
    return execute();
  }
}
