import assert from "node:assert/strict";

import type { AvailableCapitalPosition } from "../../src/domains/treasury/gateway/capital-position/availableCapitalPosition";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
} from "../../src/domains/treasury/gateway/transfer-capacity-assessments/contracts";

import { deriveCanonicalTransferCapacityConstraints } from "../../src/domains/treasury/gateway/transfer-capacity-assessments/deriveCanonicalTransferCapacityConstraints";

import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransfer,
} from "../../src/domains/treasury/gateway/transfers/contracts";

const transfer: TreasuryTransfer = {
  id: "capacity-canonical-transfer",
  reference: "AXPT-CAPACITY-CANONICAL",
  programId: "capacity-canonical-program",

  source: {
    kind: TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT,
    programAccountId: "capacity-canonical-program-account",
  },

  destination: {
    kind: TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT,
    settlementEndpointId: "capacity-canonical-destination",
  },

  requestedAmount: {
    amount: "1000000",
    currency: "USD",
  },

  destinationCurrency: "USD",
  purpose: "Canonical SOURCE_FUNDS smoke.",
  status: "AUTHORIZED",

  metadata: {
    createdAt: new Date("2026-09-05T12:00:00.000Z"),
    updatedAt: new Date("2026-09-05T12:00:00.000Z"),
    createdByActorId: "capacity-canonical-creator",
    lastModifiedByActorId: "capacity-canonical-creator",
    version: 3,
  },
};

const availableCapitalPosition: AvailableCapitalPosition = {
  programAccountId: "capacity-canonical-program-account",
  currency: "USD",

  availableAmount: {
    amount: "524980",
    currency: "USD",
  },

  grossAmount: {
    amount: "574980",
    currency: "USD",
  },

  committedAmount: {
    amount: "50000",
    currency: "USD",
  },

  contributingReceiptIds: ["receipt-a"],
  contributingExecutionIds: ["execution-a"],
  contributingAllocationIds: ["allocation-a"],
};

const constraints = deriveCanonicalTransferCapacityConstraints({
  transfer,
  availableCapitalPosition,

  submittedConstraints: [
    {
      type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
      status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,
      limit: {
        amount: "850000",
        currency: "USD",
      },
      evidenceReferenceIds: ["operator-asserted-source-funds"],
    },

    {
      type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
      status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
      evidenceReferenceIds: [],
    },

    {
      type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL,
      status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,
      limit: {
        amount: "600000",
        currency: "USD",
      },
      evidenceReferenceIds: ["rail-evidence"],
    },

    {
      type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION,
      status: TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
      evidenceReferenceIds: [],
    },
  ],
});

const sourceFunds = constraints.filter(
  (constraint) =>
    constraint.type ===
    TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
);

assert.equal(sourceFunds.length, 1);

assert.equal(
  sourceFunds[0]?.status,
  TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,
);

assert.deepEqual(sourceFunds[0]?.limit, {
  amount: "524980",
  currency: "USD",
});

assert.deepEqual(sourceFunds[0]?.evidenceReferenceIds, []);

assert.equal(
  constraints.some(
    (constraint) =>
      constraint.type === TRANSFER_CAPACITY_CONSTRAINT_TYPE.RAIL &&
      constraint.limit?.amount === "600000",
  ),
  true,
);

assert.equal(
  constraints.some(
    (constraint) =>
      constraint.type === TRANSFER_CAPACITY_CONSTRAINT_TYPE.CONVERSION &&
      constraint.status ===
        TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED,
  ),
  true,
);

function assertErrorCode(
  operation: () => unknown,
  code: string,
): void {
  assert.throws(
    operation,
    (error: unknown) =>
      error instanceof Error && error.message.includes(code),
  );
}

assertErrorCode(
  () =>
    deriveCanonicalTransferCapacityConstraints({
      transfer: {
        ...transfer,
        source: {
          kind: TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE,
          externalReference: "external-source",
        },
      },
      submittedConstraints: [],
      availableCapitalPosition,
    }),
  "TRANSFER_CAPACITY_SOURCE_FUNDS_PROGRAM_ACCOUNT_SOURCE_REQUIRED",
);

assertErrorCode(
  () =>
    deriveCanonicalTransferCapacityConstraints({
      transfer,
      submittedConstraints: [],
      availableCapitalPosition: {
        ...availableCapitalPosition,
        programAccountId: "wrong-program-account",
      },
    }),
  "TRANSFER_CAPACITY_SOURCE_FUNDS_PROGRAM_ACCOUNT_MISMATCH",
);

assertErrorCode(
  () =>
    deriveCanonicalTransferCapacityConstraints({
      transfer,
      submittedConstraints: [],
      availableCapitalPosition: {
        ...availableCapitalPosition,
        currency: "EUR",
        availableAmount: {
          amount: "524980",
          currency: "EUR",
        },
      },
    }),
  "TRANSFER_CAPACITY_SOURCE_FUNDS_CURRENCY_MISMATCH",
);

assertErrorCode(
  () =>
    deriveCanonicalTransferCapacityConstraints({
      transfer,
      submittedConstraints: [],
      availableCapitalPosition: {
        ...availableCapitalPosition,
        availableAmount: {
          amount: "524980",
          currency: "EUR",
        },
      },
    }),
  "TRANSFER_CAPACITY_SOURCE_FUNDS_CURRENCY_MISMATCH",
);

console.log(
  "✓ Treasury Gateway canonical SOURCE_FUNDS constraint smoke test passed",
);

console.log({
  sourceFunds: sourceFunds[0],

  preservedCallerConstraints: {
    rail: true,
    conversion: true,
  },

  authority: {
    submittedSourceFundsDiscarded: true,
    duplicateSubmittedSourceFundsCollapsed: true,
    availableCapitalBecameCanonicalLimit: true,
    externalEvidenceNotInvented: true,
  },

  integrity: {
    nonProgramAccountSourceRejected: true,
    programAccountMismatchRejected: true,
    currencyMismatchRejected: true,
    innerMoneyCurrencyMismatchRejected: true,
  },
});
