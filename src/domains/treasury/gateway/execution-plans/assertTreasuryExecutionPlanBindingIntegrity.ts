import type { TreasuryExecution } from "../executions/contracts";

import type {
  TreasuryExecutionPlan,
} from "./contracts";

import { EXECUTABLE_TRANCHE_STATUS } from "./status";

import type {
  LoadedTreasuryExecutionPlanBindingEvidence,
} from "./persistence/decodeTreasuryExecutionPlanBindingEvidence";

export function assertTreasuryExecutionPlanBindingIntegrity(params: {
  evidence: LoadedTreasuryExecutionPlanBindingEvidence;

  plan: TreasuryExecutionPlan;

  execution: TreasuryExecution;
}): void {
  const { evidence, plan, execution } = params;

  if (evidence.executionId !== execution.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_EXECUTION_MISMATCH] ${evidence.executionId} -> ${execution.id}`,
    );
  }

  if (evidence.planId !== plan.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_PLAN_MISMATCH] ${evidence.planId} -> ${plan.id}`,
    );
  }

  const tranche = plan.tranches.find(
    (candidate) => candidate.id === evidence.trancheId,
  );

  if (!tranche) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_NOT_FOUND] ${evidence.trancheId}`,
    );
  }

  if (
    tranche.status !==
    EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_NOT_BOUND] ${tranche.status}`,
    );
  }

  if (tranche.executionId !== execution.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_EXECUTION_MISMATCH] ${String(tranche.executionId)} -> ${execution.id}`,
    );
  }

  if (tranche.allocationId !== execution.allocationId) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_ALLOCATION_MISMATCH] ${tranche.allocationId} -> ${execution.allocationId}`,
    );
  }

  if (tranche.instructionId !== execution.instructionId) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_INSTRUCTION_MISMATCH] ${String(tranche.instructionId)} -> ${String(execution.instructionId)}`,
    );
  }

  if (tranche.executionKind !== execution.kind) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_KIND_MISMATCH] ${tranche.executionKind} -> ${execution.kind}`,
    );
  }

  if (
    tranche.beneficiaryProfileId !==
    execution.beneficiaryProfileId
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_BENEFICIARY_MISMATCH] ${String(tranche.beneficiaryProfileId)} -> ${String(execution.beneficiaryProfileId)}`,
    );
  }

  if (
    tranche.settlementEndpointId !==
    execution.settlementEndpointId
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_BINDING_SETTLEMENT_ENDPOINT_MISMATCH] ${tranche.settlementEndpointId} -> ${String(execution.settlementEndpointId)}`,
    );
  }

  if (
    tranche.amount.amount !== execution.amount.amount ||
    tranche.amount.currency !== execution.amount.currency
  ) {
    throw new Error(
      "[TREASURY_EXECUTION_PLAN_BINDING_AMOUNT_MISMATCH]",
    );
  }

  if (tranche.purpose !== execution.purpose) {
    throw new Error(
      "[TREASURY_EXECUTION_PLAN_BINDING_PURPOSE_MISMATCH]",
    );
  }
}
