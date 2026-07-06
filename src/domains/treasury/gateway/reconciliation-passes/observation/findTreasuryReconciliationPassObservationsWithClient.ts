import type { TransactionClient } from "@prisma/client";

import { findTreasuryReconciliationPassesWithClient } from "../persistence/findTreasuryReconciliationPassesWithClient";

import { loadTreasuryReconciliationPassLifecycleWithClient } from "../persistence/loadTreasuryReconciliationPassLifecycleWithClient";

import { projectTreasuryReconciliationPassObservation } from "./projectTreasuryReconciliationPassObservation";

import type { TreasuryReconciliationPassObservation } from "./contracts";

export async function findTreasuryReconciliationPassObservationsWithClient(params: {
  limit: number;

  client: TransactionClient;
}): Promise<readonly TreasuryReconciliationPassObservation[]> {
  const { limit, client } = params;

  const passes = await findTreasuryReconciliationPassesWithClient({
    limit,

    client,
  });

  const observedAt = new Date();

  return Promise.all(
    passes.map(async (pass) => {
      const lifecycle = await loadTreasuryReconciliationPassLifecycleWithClient(
        {
          passId: pass.aggregate.id,

          client,
        },
      );

      return projectTreasuryReconciliationPassObservation({
        pass,

        lifecycle,

        observedAt,
      });
    }),
  );
}
