import assert from "node:assert/strict";

import { createLegacyTreasuryActionDraft } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/createLegacyTreasuryActionDraft";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import type { TreasuryExecutionHandoff } from "../../src/domains/treasury/gateway/executions/handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../src/domains/treasury/gateway/executions/routing/contracts";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const handoff: TreasuryExecutionHandoff = {
  id: "handoff-1",

  executionId: "execution-1",

  executionVersion: 4,

  programId: "program-1",

  allocationId: "allocation-1",

  instructionId: "instruction-1",

  kind: "BENEFICIARY_DISTRIBUTION",

  beneficiaryProfileId: "beneficiary-1",

  settlementEndpointId: "endpoint-1",

  amount: {
    amount: "25.50",

    currency: "USD",
  },

  purpose: "Program beneficiary distribution",

  authorization: {
    approvalIds: ["approval-1", "approval-2"],

    authorizedAt: new Date("2026-07-04T04:00:00.000Z"),
  },

  context: {
    requestedByActorId: "actor-4",

    correlationId: "correlation-1",

    causationId: "command-authorize-1",

    idempotencyKey: "handoff-execution-1",

    requestedAt: new Date("2026-07-04T04:10:00.000Z"),
  },
};

const route: ResolvedTreasuryExecutionRoute = {
  status: "RESOLVED",

  handoffId: "handoff-1",

  executionId: "execution-1",

  adapterKind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

  capability: {
    kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

    settlementEndpointId: "endpoint-1",

    operationalInitiatorUserId: "operator-user-1",

    fromUserId: "user-1",

    toUserId: "user-2",

    assetCode: "USD",
  },
};

const draft = createLegacyTreasuryActionDraft({
  handoff,
  route,
});

assert.equal(draft.amountBaseUnits, "2550");

assert.equal(draft.status, "APPROVED");

assert.equal(draft.approvalType, "GATEWAY_AUTHORIZED");

assert.equal(draft.intent, "TREASURY");

assert.equal(draft.initiatorUserId, "operator-user-1");

assert.equal(draft.metadata.gatewayExecutionId, "execution-1");

assert.deepEqual(draft.metadata.gatewayApprovalIds, [
  "approval-1",
  "approval-2",
]);

assertThrowsWithCode(
  () =>
    createLegacyTreasuryActionDraft({
      handoff,

      route: {
        ...route,

        handoffId: "handoff-other",
      },
    }),
  "TREASURY_GATEWAY_ROUTE_HANDOFF_MISMATCH",
);

assertThrowsWithCode(
  () =>
    createLegacyTreasuryActionDraft({
      handoff: {
        ...handoff,

        amount: {
          amount: "25.50",

          currency: "EUR",
        },
      },

      route,
    }),
  "TREASURY_GATEWAY_INTERNAL_WALLET_ASSET_MISMATCH",
);

assertThrowsWithCode(
  () =>
    createLegacyTreasuryActionDraft({
      handoff: {
        ...handoff,

        amount: {
          amount: "25.501",

          currency: "USD",
        },
      },

      route,
    }),
  "Too many decimal places",
);

console.log("✓ Treasury internal wallet adapter verification passed");
