import assert from "node:assert/strict";

import {
  DIGITAL_SETTLEMENT_SENDER,
  getDigitalSettlementSender,
} from "../../src/domains/instruments/communications/digitalSettlementSender";

process.env.DSI_FROM_EMAIL = "AXPT <connect@axpt.io>";

assert.equal(
  getDigitalSettlementSender(),
  "French-Ward <french-ward@axpt.io>",
);
assert.equal(getDigitalSettlementSender(), DIGITAL_SETTLEMENT_SENDER);

console.log("DIGITAL_SETTLEMENT_SENDER_OK");
