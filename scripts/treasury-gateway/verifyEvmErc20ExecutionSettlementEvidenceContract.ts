import assert from "node:assert/strict";

import type {
  EvmErc20ExecutionSettlementEvidence,
} from "../../src/domains/treasury/gateway/executions/adapters/evm-erc20/executionEvidenceContracts";

const evidence: EvmErc20ExecutionSettlementEvidence = {
  executionId: "execution-er2h-1",

  settlementEndpointId: "settlement-endpoint-er2h-1",

  chainId: 1,

  transactionHash:
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",

  logIndex: 2,

  blockNumber: "24000000",

  blockHash:
    "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",

  receiptStatus: "success",

  tokenContractAddress:
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",

  fromAddress:
    "0x82563D9c59055A44D2633C76F08c1E1F7BfE021F",

  toAddress:
    "0x40143ECEF96EC52365c6E3164dE891C62c9A012E",

  amountBaseUnits: "50000000",

  observedHeadBlockNumber: "24000005",

  confirmationDepth: "6",

  observedAt: new Date(
    "2026-09-18T18:00:00.000Z",
  ),
};

assert.equal(
  evidence.executionId,
  "execution-er2h-1",
);

assert.equal(
  evidence.settlementEndpointId,
  "settlement-endpoint-er2h-1",
);

assert.equal(
  evidence.chainId,
  1,
);

assert.equal(
  evidence.logIndex,
  2,
);

assert.equal(
  evidence.receiptStatus,
  "success",
);

assert.equal(
  evidence.amountBaseUnits,
  "50000000",
);

assert.equal(
  evidence.confirmationDepth,
  "6",
);

/*
 * Contract doctrine:
 *
 * The rail-native object preserves chain evidence but does not yet represent
 * Treasury settlement authority.
 */
assert.ok(
  !("verifiedAt" in evidence),
);

console.log(
  "✓ EVM ERC-20 execution settlement evidence contract verification passed",
);

console.log({
  identity: {
    transactionHash:
      evidence.transactionHash,

    logIndex:
      evidence.logIndex,

    blockNumber:
      evidence.blockNumber,

    blockHash:
      evidence.blockHash,
  },

  transfer: {
    chainId:
      evidence.chainId,

    tokenContractAddress:
      evidence.tokenContractAddress,

    fromAddress:
      evidence.fromAddress,

    toAddress:
      evidence.toAddress,

    amountBaseUnits:
      evidence.amountBaseUnits,
  },

  finalityObservation: {
    observedHeadBlockNumber:
      evidence.observedHeadBlockNumber,

    confirmationDepth:
      evidence.confirmationDepth,
  },

  doctrine: {
    chainEvidenceIsNotTreasurySettlementAuthority:
      true,

    sourceAuthorizationNotYetAsserted:
      true,
  },
});
