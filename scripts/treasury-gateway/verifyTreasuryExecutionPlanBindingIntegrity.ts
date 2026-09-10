import assert from "node:assert/strict";

import {
  assertTreasuryExecutionPlanBindingIntegrity,
} from "../../src/domains/treasury/gateway/execution-plans/assertTreasuryExecutionPlanBindingIntegrity";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../../src/domains/treasury/gateway/execution-plans/status";

import {
  TREASURY_EXECUTION_KIND,
  type TreasuryExecution,
} from "../../src/domains/treasury/gateway/executions/contracts";

import {
  TREASURY_EXECUTION_STATUS,
} from "../../src/domains/treasury/gateway/executions/status";

import type {
  TreasuryExecutionPlan,
} from "../../src/domains/treasury/gateway/execution-plans/contracts";

import type {
  LoadedTreasuryExecutionPlanBindingEvidence,
} from "../../src/domains/treasury/gateway/execution-plans/persistence/decodeTreasuryExecutionPlanBindingEvidence";

const now = new Date("2026-09-11T00:00:00.000Z");

const execution: TreasuryExecution = {
  id: "execution-001",
  reference: "EXEC-001",
  programId: "program-001",
  allocationId: "allocation-001",
  instructionId: "instruction-001",
  kind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
  beneficiaryProfileId: "beneficiary-001",
  settlementEndpointId: "endpoint-001",
  amount: {
    amount: "25000",
    currency: "USDT",
  },
  purpose: "Program settlement",
  status: TREASURY_EXECUTION_STATUS.INITIATED,
  metadata: {
    createdAt: now,
    updatedAt: now,
    createdByActorId: "actor-001",
    lastModifiedByActorId: "actor-001",
    version: 6,
  },
};

const plan: TreasuryExecutionPlan = {
  id: "plan-001",
  transferId: "transfer-001",
  capacityAssessmentId: "capacity-001",
  plannedAmount: {
    amount: "25000",
    currency: "USDT",
  },
  destinationCurrency: "USDT",
  tranches: [
    {
      id: "tranche-001",
      sequence: 1,
      amount: {
        amount: "25000",
        currency: "USDT",
      },
      executionKind: TREASURY_EXECUTION_KIND.PROGRAM_TRANSFER,
      allocationId: "allocation-001",
      instructionId: "instruction-001",
      beneficiaryProfileId: "beneficiary-001",
      settlementEndpointId: "endpoint-001",
      purpose: "Program settlement",
      status: EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION,
      executionId: "execution-001",
    },
  ],
  status: TREASURY_EXECUTION_PLAN_STATUS.RECORDED,
  plannedByActorId: "actor-001",
  plannedAt: now,
  metadata: {
    createdAt: now,
    updatedAt: now,
    createdByActorId: "actor-001",
    lastModifiedByActorId: "actor-001",
    version: 4,
  },
};

const evidence: LoadedTreasuryExecutionPlanBindingEvidence = {
  executionId: "execution-001",
  planId: "plan-001",
  trancheId: "tranche-001",
  eventId: "event-binding-001",
  aggregateVersion: 4,
};

function expectCode(
  fn: () => void,
  code: string,
): void {
  let message = "";

  try {
    fn();
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(
    message.includes(`[${code}]`),
    `Expected ${code}, received: ${message || "<no error>"}`,
  );
}

assertTreasuryExecutionPlanBindingIntegrity({
  evidence,
  plan,
  execution,
});

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence: {
        ...evidence,
        executionId: "execution-other",
      },
      plan,
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_EXECUTION_MISMATCH",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence: {
        ...evidence,
        planId: "plan-other",
      },
      plan,
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_PLAN_MISMATCH",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence: {
        ...evidence,
        trancheId: "tranche-missing",
      },
      plan,
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_NOT_FOUND",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence,
      plan: {
        ...plan,
        tranches: [
          {
            ...plan.tranches[0],
            status: EXECUTABLE_TRANCHE_STATUS.ELIGIBLE,
            executionId: undefined,
          },
        ],
      },
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_NOT_BOUND",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence,
      plan: {
        ...plan,
        tranches: [
          {
            ...plan.tranches[0],
            executionId: "execution-other",
          },
        ],
      },
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_TRANCHE_EXECUTION_MISMATCH",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence,
      plan: {
        ...plan,
        tranches: [
          {
            ...plan.tranches[0],
            allocationId: "allocation-other",
          },
        ],
      },
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_ALLOCATION_MISMATCH",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence,
      plan: {
        ...plan,
        tranches: [
          {
            ...plan.tranches[0],
            amount: {
              amount: "24999",
              currency: "USDT",
            },
          },
        ],
      },
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_AMOUNT_MISMATCH",
);

expectCode(
  () =>
    assertTreasuryExecutionPlanBindingIntegrity({
      evidence,
      plan: {
        ...plan,
        tranches: [
          {
            ...plan.tranches[0],
            settlementEndpointId: "endpoint-other",
          },
        ],
      },
      execution,
    }),
  "TREASURY_EXECUTION_PLAN_BINDING_SETTLEMENT_ENDPOINT_MISMATCH",
);

console.log(
  "✓ Treasury Execution Plan binding integrity verification passed",
);

console.log({
  invariants: {
    canonicalBindingAccepted: true,
    evidenceExecutionIdentityRequired: true,
    evidencePlanIdentityRequired: true,
    boundTrancheRequired: true,
    trancheMustRemainBound: true,
    trancheExecutionIdentityRequired: true,
    allocationIdentityPreserved: true,
    amountPreserved: true,
    settlementEndpointPreserved: true,
  },
});
