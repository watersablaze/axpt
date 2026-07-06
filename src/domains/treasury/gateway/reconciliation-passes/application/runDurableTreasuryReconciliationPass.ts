import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { runTreasuryExecutionReconciliationBatch } from "../../executions/application/runTreasuryExecutionReconciliationBatch";

import { persistNewTreasuryReconciliationPassWithClient } from "../persistence/persistNewTreasuryReconciliationPassWithClient";

import { persistTreasuryReconciliationPassTransitionWithClient } from "../persistence/persistTreasuryReconciliationPassTransitionWithClient";

import { runDurableTreasuryReconciliationPassWithDependencies } from "./runDurableTreasuryReconciliationPassWithDependencies";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { DurableTreasuryReconciliationPassResult } from "./runDurableTreasuryReconciliationPassContracts";

export async function runDurableTreasuryReconciliationPass(params: {
  passId: string;

  limit: number;

  context: TreasuryCommandContext;
}): Promise<DurableTreasuryReconciliationPassResult> {
  return runDurableTreasuryReconciliationPassWithDependencies({
    ...params,

    persistRequestedPass: async ({ result, eventId, context }) =>
      prisma.$transaction(async (tx: TransactionClient) => {
        const persisted = await persistNewTreasuryReconciliationPassWithClient({
          result,

          eventId,

          context,

          client: tx,
        });

        return persisted.aggregate;
      }),

    persistPassTransition: async ({
      expectedVersion,
      result,
      eventId,
      context,
    }) =>
      prisma.$transaction(async (tx: TransactionClient) => {
        const persisted =
          await persistTreasuryReconciliationPassTransitionWithClient({
            expectedVersion,

            result,

            eventId,

            context,

            client: tx,
          });

        return persisted.aggregate;
      }),

    runBatch: runTreasuryExecutionReconciliationBatch,
  });
}
