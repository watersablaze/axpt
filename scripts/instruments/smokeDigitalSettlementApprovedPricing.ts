import assert from "node:assert/strict";

import { DSI_APPROVED_ISSUANCE_PRICING } from "../../src/domains/instruments/definitions/digitalSettlementV1Definition";

assert.deepEqual(DSI_APPROVED_ISSUANCE_PRICING, {
  spotBenchmark:
    "LBMA Gold Price PM · 2026-09-18 · USD 4,348.15 per troy ounce",
  spotPricePerKgUsd: "139796.27",
  pricePerKgUsd: "125816.64",
  transactionValueUsd: "6290832.00",
  settlementAmountUsd: "471812.40",
});

console.log("DIGITAL_SETTLEMENT_APPROVED_PRICING_OK");
