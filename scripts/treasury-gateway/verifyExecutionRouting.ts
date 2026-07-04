import assert from "node:assert/strict";

import { resolveTreasuryExecutionRoute } from "../../src/domains/treasury/gateway/executions/routing/resolveTreasuryExecutionRoute";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../../src/domains/treasury/gateway/executions/routing/contracts";

import type { TreasuryExecutionHandoff } from "../../src/domains/treasury/gateway/executions/handoff/contracts";

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
    amount: "25.5",

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

const unresolvedMissingCapability = resolveTreasuryExecutionRoute({
  handoff,
});

assert.equal(unresolvedMissingCapability.status, "UNRESOLVED");

assert.equal(
  unresolvedMissingCapability.reason,
  "SETTLEMENT_CAPABILITY_NOT_FOUND",
);

const unresolvedMismatch = resolveTreasuryExecutionRoute({
  handoff,

  capability: {
    kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

    settlementEndpointId: "endpoint-other",

    fromUserId: "user-1",

    toUserId: "user-2",

    assetCode: "USD",
  },
});

assert.equal(unresolvedMismatch.status, "UNRESOLVED");

assert.equal(
  unresolvedMismatch.reason,
  "SETTLEMENT_CAPABILITY_ENDPOINT_MISMATCH",
);

const internalWallet = resolveTreasuryExecutionRoute({
  handoff,

  capability: {
    kind: TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,

    settlementEndpointId: "endpoint-1",

    fromUserId: "user-1",

    toUserId: "user-2",

    assetCode: "USD",
  },
});

assert.equal(internalWallet.status, "RESOLVED");

if (internalWallet.status === "RESOLVED") {
  assert.equal(
    internalWallet.adapterKind,
    TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET,
  );
}

const externalRail = resolveTreasuryExecutionRoute({
  handoff,

  capability: {
    kind: TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,

    settlementEndpointId: "endpoint-1",

    railCode: "SWIFT",
  },
});

assert.equal(externalRail.status, "RESOLVED");

if (externalRail.status === "RESOLVED") {
  assert.equal(
    externalRail.adapterKind,
    TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,
  );
}

const manualOperation = resolveTreasuryExecutionRoute({
  handoff,

  capability: {
    kind: TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,

    settlementEndpointId: "endpoint-1",

    operationCode: "OPERATOR_SETTLEMENT",
  },
});

assert.equal(manualOperation.status, "RESOLVED");

if (manualOperation.status === "RESOLVED") {
  assert.equal(
    manualOperation.adapterKind,
    TREASURY_EXECUTION_ADAPTER_KIND.MANUAL_TREASURY_OPERATION,
  );
}

const endpointlessHandoff: TreasuryExecutionHandoff = {
  ...handoff,

  settlementEndpointId: undefined,
};

const unresolvedEndpoint = resolveTreasuryExecutionRoute({
  handoff: endpointlessHandoff,
});

assert.equal(unresolvedEndpoint.status, "UNRESOLVED");

assert.equal(unresolvedEndpoint.reason, "SETTLEMENT_ENDPOINT_REQUIRED");

console.log("✓ Treasury execution routing verification passed");
