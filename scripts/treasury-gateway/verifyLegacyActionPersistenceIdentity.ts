import assert from "node:assert/strict";

import { assertPersistedLegacyTreasuryActionMatchesDraft } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/assertPersistedLegacyTreasuryActionMatchesDraft";

import type { LegacyTreasuryActionDraft } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/contracts";

function assertThrowsWithCode(fn: () => unknown, code: string): void {
  assert.throws(
    fn,
    (error: unknown) => error instanceof Error && error.message.includes(code),
  );
}

const draft: LegacyTreasuryActionDraft = {
  initiatorUserId: "operator-user-1",

  fromUserId: "user-1",

  toUserId: "user-2",

  assetCode: "USD",

  amountBaseUnits: "2550",

  intent: "TREASURY",

  approvalType: "GATEWAY_AUTHORIZED",

  status: "APPROVED",

  idempotencyKey: "handoff-execution-1",

  metadata: {
    source: "TREASURY_GATEWAY",

    gatewayExecutionId: "execution-1",

    gatewayExecutionVersion: 4,

    gatewayHandoffId: "handoff-1",

    gatewayProgramId: "program-1",

    gatewayAllocationId: "allocation-1",

    gatewayInstructionId: "instruction-1",

    gatewayExecutionKind: "BENEFICIARY_DISTRIBUTION",

    gatewayApprovalIds: ["approval-1", "approval-2"],

    gatewayAuthorizedAt: "2026-07-04T04:00:00.000Z",

    gatewayCorrelationId: "correlation-1",

    gatewayCausationId: "command-authorize-1",
  },
};

const persisted = {
  ...draft,

  status: "QUEUED",

  amountBaseUnits: {
    toString: () => "2550",
  },
};

assert.doesNotThrow(() => {
  assertPersistedLegacyTreasuryActionMatchesDraft(persisted, draft);
});

assertThrowsWithCode(
  () =>
    assertPersistedLegacyTreasuryActionMatchesDraft(
      {
        ...persisted,

        amountBaseUnits: {
          toString: () => "9999",
        },
      },

      draft,
    ),
  "TREASURY_GATEWAY_LEGACY_ACTION_IDEMPOTENCY_COLLISION",
);

assertThrowsWithCode(
  () =>
    assertPersistedLegacyTreasuryActionMatchesDraft(
      {
        ...persisted,

        metadata: {
          ...draft.metadata,

          gatewayExecutionId: "execution-other",
        },
      },

      draft,
    ),
  "TREASURY_GATEWAY_LEGACY_ACTION_IDEMPOTENCY_COLLISION",
);

assertThrowsWithCode(
  () =>
    assertPersistedLegacyTreasuryActionMatchesDraft(
      {
        ...persisted,

        fromUserId: "user-other",
      },

      draft,
    ),
  "TREASURY_GATEWAY_LEGACY_ACTION_IDEMPOTENCY_COLLISION",
);

console.log(
  "✓ Treasury legacy action persistence identity verification passed",
);
