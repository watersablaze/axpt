import type { TransactionClient } from "@prisma/client";

import { loadTreasuryReconciliationPassLifecycleWithClient } from "../persistence/loadTreasuryReconciliationPassLifecycleWithClient";

import { loadTreasuryReconciliationPassWithClient } from "../persistence/loadTreasuryReconciliationPassWithClient";

import { projectTreasuryReconciliationPassObservation } from "./projectTreasuryReconciliationPassObservation";

import type { TreasuryReconciliationPassObservation } from "./contracts";

export async function loadTreasuryReconciliationPassObservationWithClient(params: {
  passId: string;

  client: TransactionClient;
}): Promise<TreasuryReconciliationPassObservation | null> {
  const { passId, client } = params;

  const pass = await loadTreasuryReconciliationPassWithClient({
    passId,

    client,
  });

  if (!pass) {
    return null;
  }

  const lifecycle = await loadTreasuryReconciliationPassLifecycleWithClient({
    passId,

    client,
  });

  return projectTreasuryReconciliationPassObservation({
    pass,

    lifecycle,

    observedAt: new Date(),
  });
}
