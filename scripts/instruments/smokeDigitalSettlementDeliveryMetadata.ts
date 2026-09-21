import assert from "node:assert/strict";

import {
  assertSafeDigitalSettlementDeliveryRawPayload,
} from "../../src/domains/instruments/communications/digitalSettlementDeliveryMetadata";

assert.doesNotThrow(() =>
  assertSafeDigitalSettlementDeliveryRawPayload({
    reference: "FW-DSI-2026-001",
    version: 2,
    recipientKey: "financier",
    grantId: "grant-1",
    deliveryKey:
      "DSI_V2_2_grant-1_financier",
  }),
);

for (const rawPayload of [
  { token: "secret" },
  { accessToken: "secret" },
  { accessUrl: "https://example.test/private" },
  { access_path: "/private/path" },
  { privateUrl: "https://example.test/private" },
  { html: "<p>secret</p>" },
  { text: "secret message" },
  {
    nested: {
      access_url:
        "https://example.test/private",
    },
  },
]) {
  assert.throws(
    () =>
      assertSafeDigitalSettlementDeliveryRawPayload(
        rawPayload,
      ),
    /DSI_DELIVERY_RAW_PAYLOAD_FORBIDDEN/,
  );
}

console.log(
  "DIGITAL_SETTLEMENT_DELIVERY_METADATA_GUARD_OK",
);
console.log(
  "BEARER_MATERIAL_REJECTED_FROM_EMAIL_LOG_METADATA_OK",
);
