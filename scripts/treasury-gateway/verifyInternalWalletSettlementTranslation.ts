import assert from "node:assert/strict";

import type { InternalWalletExecutionSettlementProof } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/executionEvidenceContracts";

import { toVerifiedTreasuryExecutionSettlement } from "../../src/domains/treasury/gateway/executions/adapters/internal-wallet/toVerifiedTreasuryExecutionSettlement";

const verifiedAt = new Date("2026-09-14T06:00:00.000Z");

const proof: InternalWalletExecutionSettlementProof = {
  executionId: "execution-er1d-001",

  treasuryActionId: "treasury-action-er1d-001",

  idempotencyKey: "internal-wallet-er1d-001",

  debitTransactionId: "debit-er1d-001",

  creditTransactionId: "credit-er1d-001",

  assetCode: "USD",

  amountBaseUnits: "2550",

  verifiedAt,
};

const settlement = toVerifiedTreasuryExecutionSettlement(proof);

assert.deepEqual(settlement, {
  executionId: "execution-er1d-001",

  amount: {
    amount: "25.5",

    currency: "USD",
  },

  verifiedAt,
});

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "treasuryActionId"),
  false,
);

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "idempotencyKey"),
  false,
);

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "debitTransactionId"),
  false,
);

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "creditTransactionId"),
  false,
);

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "amountBaseUnits"),
  false,
);

assert.equal(
  Object.prototype.hasOwnProperty.call(settlement, "assetCode"),
  false,
);

console.log(
  "✓ Internal-wallet base units normalize to rail-neutral Treasury money",
);
