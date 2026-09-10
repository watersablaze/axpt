import type { TransactionClient } from "@prisma/client";

import { createTreasuryExecutionFromEligibleTranche } from "../createTreasuryExecutionFromEligibleTranche";

import { bindExecutableTrancheToTreasuryExecution } from "../bindExecutableTrancheToTreasuryExecution";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { loadTreasuryTransferPlanningEvidenceWithClient } from "../../transfers/persistence/loadTreasuryTransferPlanningEvidenceWithClient";

import { loadTreasuryAllocationWithClient } from "../../allocations/persistence/loadTreasuryAllocationWithClient";

import { assertTreasuryExecutionAllocationAuthority } from "../assertTreasuryExecutionAllocationAuthority";

import { loadTreasuryExecutionPlanWithClient } from "../persistence/loadTreasuryExecutionPlanWithClient";

import { persistNewTreasuryExecutionWithClient } from "../../executions/persistence/persistNewTreasuryExecutionWithClient";

import { persistTreasuryExecutionPlanTransitionWithClient } from "../persistence/persistTreasuryExecutionPlanTransitionWithClient";

import type {
  InstantiateTreasuryExecutionFromEligibleTrancheDurably,
  PersistedTreasuryExecutionInstantiation,
} from "./instantiateTreasuryExecutionFromEligibleTrancheDurablyContracts";

export async function instantiateTreasuryExecutionFromEligibleTrancheDurablyWithClient(
  params: InstantiateTreasuryExecutionFromEligibleTrancheDurably & {
    client: TransactionClient;
  },
): Promise<PersistedTreasuryExecutionInstantiation> {
  const {
    transferId,
    planId,
    trancheId,
    executionId,
    executionReference,
    executionCreatedEventId,
    trancheBoundEventId,
    context,
    client,
  } = params;

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId,

    client,
  });

  if (!loadedTransfer) {
    throw new Error(`[TREASURY_GATEWAY_TRANSFER_NOT_FOUND] ${transferId}`);
  }

  const loadedPlan = await loadTreasuryExecutionPlanWithClient({
    planId,

    client,
  });

  if (!loadedPlan) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_PLAN_NOT_FOUND] ${planId}`);
  }

  const executionResult = createTreasuryExecutionFromEligibleTranche({
    executionId,

    reference: executionReference,

    transfer: loadedTransfer.aggregate,

    plan: loadedPlan.aggregate,

    command: {
      context,

      payload: {
        transferId,

        planId,

        trancheId,
      },
    },
  });

  const operativePlanningEvidence =
    await loadTreasuryTransferPlanningEvidenceWithClient({
      transferId: loadedTransfer.aggregate.id,

      transferVersion: loadedTransfer.aggregate.metadata.version,

      client,
    });

  if (!operativePlanningEvidence) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_OPERATIVE_PLAN_NOT_FOUND] ${loadedTransfer.aggregate.id}`,
    );
  }

  if (operativePlanningEvidence.planId !== loadedPlan.aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_PLAN_NOT_OPERATIVE] ${loadedPlan.aggregate.id} -> ${operativePlanningEvidence.planId}`,
    );
  }

  const loadedAllocation = await loadTreasuryAllocationWithClient({
    allocationId: executionResult.aggregate.allocationId,

    client,
  });

  if (!loadedAllocation) {
    throw new Error(
      `[TREASURY_EXECUTION_INSTANTIATION_ALLOCATION_NOT_FOUND] ${executionResult.aggregate.allocationId}`,
    );
  }

  assertTreasuryExecutionAllocationAuthority({
    allocation: loadedAllocation.aggregate,

    transfer: loadedTransfer.aggregate,

    execution: executionResult.aggregate,
  });

  const bindingResult = bindExecutableTrancheToTreasuryExecution(
    loadedPlan.aggregate,

    executionResult.aggregate,

    {
      context,

      payload: {
        planId,

        trancheId,

        executionId,
      },
    },
  );

  const persistedExecution = await persistNewTreasuryExecutionWithClient({
    result: executionResult,

    eventId: executionCreatedEventId,

    context,

    client,
  });

  const persistedPlan = await persistTreasuryExecutionPlanTransitionWithClient({
    expectedVersion: loadedPlan.aggregate.metadata.version,

    result: bindingResult,

    eventId: trancheBoundEventId,

    context,

    client,
  });

  return {
    execution: persistedExecution,

    plan: persistedPlan,
  };
}
