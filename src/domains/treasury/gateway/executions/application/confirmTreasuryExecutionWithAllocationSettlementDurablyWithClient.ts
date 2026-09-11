import type { TransactionClient } from "@prisma/client";

import { consumeTreasuryAllocationDurablyWithClient } from "../../allocations/application/consumeTreasuryAllocationDurablyWithClient";

import { loadTreasuryAllocationWithClient } from "../../allocations/persistence/loadTreasuryAllocationWithClient";

import { assertTreasuryExecutionAllocationAuthority } from "../../execution-plans/assertTreasuryExecutionAllocationAuthority";

import { assertTreasuryExecutionPlanBindingIntegrity } from "../../execution-plans/assertTreasuryExecutionPlanBindingIntegrity";

import { loadTreasuryExecutionPlanBindingEvidenceWithClient } from "../../execution-plans/persistence/loadTreasuryExecutionPlanBindingEvidenceWithClient";

import { loadTreasuryExecutionPlanWithClient } from "../../execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import type { InternalWalletExecutionConfirmedEvidence } from "../adapters/internal-wallet/executionEvidenceContracts";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { confirmTreasuryExecutionDurablyWithClient } from "./confirmTreasuryExecutionDurablyWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryEventId } from "../../shared/identifiers";

export async function confirmTreasuryExecutionWithAllocationSettlementDurablyWithClient(params: {
  evidence: InternalWalletExecutionConfirmedEvidence;

  allocationConsumedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}) {
  const {
    evidence,
    allocationConsumedEventId,
    confirmedEventId,
    context,
    client,
  } = params;

  const loadedExecution = await loadTreasuryExecutionWithClient({
    executionId: evidence.executionId,

    client,
  });

  if (!loadedExecution) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${evidence.executionId}`,
    );
  }

  const execution = loadedExecution.aggregate;

  const bindingEvidence =
    await loadTreasuryExecutionPlanBindingEvidenceWithClient({
      executionId: execution.id,

      client,
    });

  if (!bindingEvidence) {
    throw new Error(
      `[TREASURY_EXECUTION_CONFIRMATION_PLAN_BINDING_NOT_FOUND] ${execution.id}`,
    );
  }

  const loadedPlan = await loadTreasuryExecutionPlanWithClient({
    planId: bindingEvidence.planId,

    client,
  });

  if (!loadedPlan) {
    throw new Error(
      `[TREASURY_EXECUTION_CONFIRMATION_PLAN_NOT_FOUND] ${bindingEvidence.planId}`,
    );
  }

  assertTreasuryExecutionPlanBindingIntegrity({
    evidence: bindingEvidence,

    plan: loadedPlan.aggregate,

    execution,
  });

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId: loadedPlan.aggregate.transferId,

    client,
  });

  if (!loadedTransfer) {
    throw new Error(
      `[TREASURY_EXECUTION_CONFIRMATION_TRANSFER_NOT_FOUND] ${loadedPlan.aggregate.transferId}`,
    );
  }

  const loadedAllocation = await loadTreasuryAllocationWithClient({
    allocationId: execution.allocationId,

    client,
  });

  if (!loadedAllocation) {
    throw new Error(
      `[TREASURY_EXECUTION_CONFIRMATION_ALLOCATION_NOT_FOUND] ${execution.allocationId}`,
    );
  }

  /*
   * EP-3A established Allocation authority when the Execution was created.
   *
   * EP-3B deliberately re-proves that authority against current canonical
   * state at the settlement boundary. Execution creation did not reserve
   * additional capital, so the original finding cannot authorize stale or
   * over-subscribed Allocation consumption.
   */
  assertTreasuryExecutionAllocationAuthority({
    allocation: loadedAllocation.aggregate,

    transfer: loadedTransfer.aggregate,

    execution,
  });

  /*
   * The Allocation consumption and Execution confirmation are separate
   * durable financial facts, but they execute through the same
   * TransactionClient. The caller's database transaction therefore commits
   * both facts or neither.
   */
  const allocation = await consumeTreasuryAllocationDurablyWithClient({
    allocationId: execution.allocationId,

    amount: execution.amount,

    consumingSubjectType: "TREASURY_EXECUTION",

    consumingSubjectId: execution.id,

    eventId: allocationConsumedEventId,

    context,

    client,
  });

  const confirmed = await confirmTreasuryExecutionDurablyWithClient({
    evidence,

    eventId: confirmedEventId,

    context,

    client,
  });

  return {
    allocation,

    confirmed,
  };
}
