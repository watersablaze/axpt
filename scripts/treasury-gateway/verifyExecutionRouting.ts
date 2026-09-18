import assert from "node:assert/strict";

import { resolveTreasuryExecutionRoute } from "../../src/domains/treasury/gateway/executions/routing/resolveTreasuryExecutionRoute";

import {
  TREASURY_EXECUTION_ADAPTER_KIND,
  TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE,
  type ExternalSettlementRailCapability,
} from "../../src/domains/treasury/gateway/executions/routing/contracts";

import { deriveExternalSettlementRailCapability } from "../../src/domains/treasury/gateway/executions/routing/deriveExternalSettlementRailCapability";

import {
  SETTLEMENT_ENDPOINT_KIND,
  type SettlementEndpoint,
} from "../../src/domains/treasury/gateway/settlement-endpoints/contracts";

import { SETTLEMENT_ENDPOINT_STATUS } from "../../src/domains/treasury/gateway/settlement-endpoints/status";

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

    operationalInitiatorUserId: "operator-user-1",

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

    operationalInitiatorUserId: "operator-user-1",

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

const externalSettlementEndpoint: SettlementEndpoint = {
  id: "endpoint-1",

  reference: "Ethereum Mainnet USDT endpoint",

  kind: SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,

  coordinates: {
    kind: SETTLEMENT_ENDPOINT_KIND.EVM_ERC20,

    chainId: 1,

    network: "ethereum-mainnet",

    address:
      "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",

    assetCode: "USDT",

    tokenContractAddress:
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",

    tokenDecimals: 6,
  },

  status: SETTLEMENT_ENDPOINT_STATUS.ACTIVE,

  metadata: {
    createdAt: new Date("2026-07-04T03:00:00.000Z"),

    updatedAt: new Date("2026-07-04T03:00:00.000Z"),

    createdByActorId: "actor-1",

    lastModifiedByActorId: "actor-1",

    version: 1,
  },
};

const externalCapability =
  deriveExternalSettlementRailCapability(
    externalSettlementEndpoint,
  );

assert.equal(
  externalCapability.railCode,
  TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE.EVM_ERC20,
);

const externalRail = resolveTreasuryExecutionRoute({
  handoff,

  capability: externalCapability,
});

assert.equal(externalRail.status, "RESOLVED");

if (externalRail.status === "RESOLVED") {
  assert.equal(
    externalRail.adapterKind,
    TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,
  );

  assert.equal(
    externalRail.capability.settlementEndpointId,
    "endpoint-1",
  );
}

/*
 * Nominal containment:
 * ordinary callers must not be able to manufacture
 * external rail authority structurally.
 */
// @ts-expect-error External rail capability must be derived.
const structurallyManufacturedExternalCapability:
  ExternalSettlementRailCapability = {
    kind:
      TREASURY_EXECUTION_ADAPTER_KIND.EXTERNAL_SETTLEMENT_RAIL,

    settlementEndpointId: "endpoint-1",

    railCode:
      TREASURY_EXTERNAL_SETTLEMENT_RAIL_CODE.EVM_ERC20,
  };

void structurallyManufacturedExternalCapability;

assert.throws(
  () =>
    deriveExternalSettlementRailCapability({
      ...externalSettlementEndpoint,

      status: SETTLEMENT_ENDPOINT_STATUS.SUSPENDED,
    }),

  /TREASURY_GATEWAY_SETTLEMENT_ENDPOINT_NOT_ACTIVE/,
);

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
