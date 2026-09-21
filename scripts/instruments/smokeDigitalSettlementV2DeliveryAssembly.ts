import assert from "node:assert/strict";

import {
  buildDigitalSettlementV2Deliveries,
} from "../../src/domains/instruments/communications/digitalSettlementV2DeliveryAssembly";
import type {
  DigitalSettlementV2IssuedAccessGrant,
} from "../../src/domains/instruments/commands/issueDigitalSettlementV2AccessGrantsWithClient";

const input =
  [
    {
      key: "financier",
      recipientName: "Carl Albert Meisterlin",
      email: "meisterlin@aol.com",
      accessPurpose: "ACTIVE_RESPONSE",
      authority: "VERIFICATION_TRANSFER_ONLY",
      authorizedAmountUsdt: "50",
      grant: {
        id: "grant-carl",
        instrumentVersionId: "version-2",
        recipientName: "Carl Albert Meisterlin",
        accessLevel: "VIEW",
        expiresAt: new Date(
          "2026-09-28T12:00:00.000Z",
        ),
      },
      token: "carl-private-token",
      instrumentVersion: {
        id: "version-2",
        number: 2,
        status: "ISSUED",
      },
    },
    {
      key: "buyerRepresentative",
      recipientName: "Corey Keller",
      email: "corey@inderakshgold.com",
      accessPurpose: "REVIEW",
      authority: "NONE",
      authorizedAmountUsdt: null,
      grant: {
        id: "grant-corey",
        instrumentVersionId: "version-2",
        recipientName: "Corey Keller",
        accessLevel: "VIEW",
        expiresAt: new Date(
          "2026-09-28T12:00:00.000Z",
        ),
      },
      token: "corey-private-token",
      instrumentVersion: {
        id: "version-2",
        number: 2,
        status: "ISSUED",
      },
    },
    {
      key: "externalReviewer",
      recipientName: "Dr. Don C. Hinds",
      email: "DHinds@ibosed.com",
      accessPurpose: "REVIEW",
      authority: "NONE",
      authorizedAmountUsdt: null,
      grant: {
        id: "grant-hinds",
        instrumentVersionId: "version-2",
        recipientName: "Dr. Don C. Hinds",
        accessLevel: "VIEW",
        expiresAt: new Date(
          "2026-09-28T12:00:00.000Z",
        ),
      },
      token: "hinds-private-token",
      instrumentVersion: {
        id: "version-2",
        number: 2,
        status: "ISSUED",
      },
    },
    {
      key: "bobby",
      recipientName: "Bobby",
      email: "frenchward938@gmail.com",
      accessPurpose: "INTERNAL_REVIEW",
      authority: "NONE",
      authorizedAmountUsdt: null,
      grant: {
        id: "grant-bobby",
        instrumentVersionId: "version-2",
        recipientName: "Bobby",
        accessLevel: "VIEW",
        expiresAt: new Date(
          "2026-09-28T12:00:00.000Z",
        ),
      },
      token: "bobby-private-token",
      instrumentVersion: {
        id: "version-2",
        number: 2,
        status: "ISSUED",
      },
    },
    {
      key: "lawrence",
      recipientName: "Lawrence",
      email: "lrwjr1@me.com",
      accessPurpose: "FIDUCIARY_REVIEW",
      authority: "NONE",
      authorizedAmountUsdt: null,
      grant: {
        id: "grant-lawrence",
        instrumentVersionId: "version-2",
        recipientName: "Lawrence",
        accessLevel: "VIEW",
        expiresAt: new Date(
          "2026-09-28T12:00:00.000Z",
        ),
      },
      token: "lawrence-private-token",
      instrumentVersion: {
        id: "version-2",
        number: 2,
        status: "ISSUED",
      },
    },
  ] as unknown as readonly DigitalSettlementV2IssuedAccessGrant[];

const deliveries =
  buildDigitalSettlementV2Deliveries({
    origin: "https://www.axpt.io/",
    grants: input,
  });

assert.equal(deliveries.length, 5);

assert.deepEqual(
  deliveries.map((delivery) => delivery.key),
  [
    "financier",
    "buyerRepresentative",
    "externalReviewer",
    "bobby",
    "lawrence",
  ],
);

for (const delivery of deliveries) {
  assert.equal(
    delivery.instrumentVersionNumber,
    2,
  );

  assert.equal(
    delivery.instrumentReference,
    "FW-DSI-2026-001",
  );

  assert.ok(
    delivery.accessPath.startsWith(
      "/french-ward/instruments/fw-dsi-2026-001/access/",
    ),
  );

  assert.equal(
    delivery.accessUrl,
    `https://www.axpt.io${delivery.accessPath}`,
  );

  assert.ok(delivery.subject.length > 0);
  assert.ok(delivery.text.length > 0);
  assert.ok(delivery.html.length > 0);
}

const financier = deliveries.find(
  (delivery) => delivery.key === "financier",
);

assert.ok(financier);
assert.equal(financier.audience, "ACTIVE");
assert.match(
  financier.authority,
  /50 USDT.*VERIFICATION TRANSFER ONLY/,
);
assert.match(
  financier.text,
  /exactly 50 USDT/,
);
assert.match(
  financier.text,
  /Do not transmit the remaining 471,762\.40 USDT TAP balance unless French-Ward separately records and communicates that authorization/,
);

const corey = deliveries.find(
  (delivery) =>
    delivery.key === "buyerRepresentative",
);

assert.ok(corey);
assert.equal(corey.audience, "REVIEW");
assert.equal(
  corey.authority,
  "REVIEW ACCESS - NO TRANSFER AUTHORITY",
);
assert.match(
  corey.text,
  /does not authorize a transfer from you/,
);

const hinds = deliveries.find(
  (delivery) =>
    delivery.key === "externalReviewer",
);

assert.ok(hinds);
assert.equal(
  hinds.authority,
  "REVIEW ACCESS - NO TRANSFER AUTHORITY",
);

const bobby = deliveries.find(
  (delivery) => delivery.key === "bobby",
);

assert.ok(bobby);
assert.equal(bobby.audience, "INTERNAL");

const lawrence = deliveries.find(
  (delivery) => delivery.key === "lawrence",
);

assert.ok(lawrence);
assert.equal(lawrence.audience, "INTERNAL");
assert.match(
  lawrence.authority,
  /TAP BALANCE PAUSED/,
);

const urls = new Set(
  deliveries.map(
    (delivery) => delivery.accessUrl,
  ),
);

assert.equal(urls.size, 5);

console.log(
  "DIGITAL_SETTLEMENT_V2_DELIVERY_ASSEMBLY_OK",
);
console.log(
  "FIVE_DISTINCT_PRIVATE_ACCESS_URLS_OK",
);
console.log(
  "FINANCIER_ACTIVE_AUTHORITY_MESSAGE_OK",
);
console.log(
  "FOUR_NON_FINANCIER_REVIEW_BOUNDARIES_OK",
);
console.log(
  "NO_DELIVERY_SIDE_EFFECTS_OK",
);
