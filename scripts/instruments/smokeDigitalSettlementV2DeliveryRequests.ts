import assert from "node:assert/strict";

import {
  buildDigitalSettlementV2DeliveryRequests,
} from "../../src/domains/instruments/communications/digitalSettlementV2DeliveryRequests";
import type {
  DigitalSettlementV2Delivery,
} from "../../src/domains/instruments/communications/digitalSettlementV2DeliveryAssembly";

const keys = [
  "financier",
  "buyerRepresentative",
  "externalReviewer",
  "bobby",
  "lawrence",
] as const;

const deliveries = keys.map(
  (key, index) =>
    ({
      key,
      recipientName: `Recipient ${index + 1}`,
      email: `recipient${index + 1}@example.test`,
      grantId: `grant-${index + 1}`,
      instrumentReference:
        "FW-DSI-2026-001",
      instrumentVersionNumber: 2,
      accessPath:
        `/private/${index + 1}`,
      accessUrl:
        `https://www.axpt.io/private/${index + 1}`,
      audience:
        key === "financier"
          ? "ACTIVE"
          : key === "bobby" ||
              key === "lawrence"
            ? "INTERNAL"
            : "REVIEW",
      subject: `Subject ${index + 1}`,
      heading: `Heading ${index + 1}`,
      authority: "TEST",
      ctaLabel: "Open",
      text: `Private text ${index + 1}`,
      html: `<p>Private html ${index + 1}</p>`,
    }) as DigitalSettlementV2Delivery,
);

const requests =
  buildDigitalSettlementV2DeliveryRequests(
    deliveries,
  );

assert.equal(requests.length, 5);

assert.deepEqual(
  requests.map((request) =>
    request.recipientKey
  ),
  [...keys],
);

assert.deepEqual(
  requests.map((request) =>
    request.deliveryKey
  ),
  [
    "DSI_V2_2_grant-1_financier",
    "DSI_V2_2_grant-2_buyerRepresentative",
    "DSI_V2_2_grant-3_externalReviewer",
    "DSI_V2_2_grant-4_bobby",
    "DSI_V2_2_grant-5_lawrence",
  ],
);

for (const request of requests) {
  assert.deepEqual(
    Object.keys(
      request.input.rawPayload,
    ).sort(),
    [
      "grantId",
      "recipientKey",
      "reference",
      "version",
    ],
  );

  assert.equal(
    "token" in request.input.rawPayload,
    false,
  );

  assert.equal(
    "accessUrl" in
      request.input.rawPayload,
    false,
  );

  assert.equal(
    "accessPath" in
      request.input.rawPayload,
    false,
  );

  assert.equal(
    "text" in request.input.rawPayload,
    false,
  );

  assert.equal(
    "html" in request.input.rawPayload,
    false,
  );
}

console.log(
  "DIGITAL_SETTLEMENT_V2_DELIVERY_REQUESTS_OK",
);
console.log(
  "FIVE_STABLE_DELIVERY_IDENTITIES_OK",
);
console.log(
  "EMAIL_LOG_METADATA_BEARER_FREE_OK",
);
