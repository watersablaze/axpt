import assert from "node:assert/strict";

import {
  INSTRUMENT_ACCESS_LEVEL,
  INSTRUMENT_PARTY_ROLE,
} from "../../src/domains/instruments/contracts";
import {
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN,
  DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE,
  DIGITAL_SETTLEMENT_V2_AUTHORITY,
} from "../../src/domains/instruments/definitions/digitalSettlementV2AccessPlan";

assert.equal(
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.length,
  5,
);

for (const entry of DIGITAL_SETTLEMENT_V2_ACCESS_PLAN) {
  assert.equal(
    entry.instrumentVersionNumber,
    2,
  );

  assert.equal(
    entry.accessLevel,
    INSTRUMENT_ACCESS_LEVEL.VIEW,
  );
}

const active = DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.filter(
  (entry) =>
    entry.accessPurpose ===
    DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.ACTIVE_RESPONSE,
);

assert.equal(active.length, 1);

const financier = active[0];

assert.ok(financier);
assert.equal(
  financier.key,
  "financier",
);
assert.equal(
  financier.recipientName,
  "Carl Albert Meisterlin",
);
assert.equal(
  financier.email,
  "meisterlin@aol.com",
);
assert.equal(
  financier.recipientRole,
  INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
);
assert.equal(
  financier.authority,
  DIGITAL_SETTLEMENT_V2_AUTHORITY.VERIFICATION_TRANSFER_ONLY,
);
assert.equal(
  financier.authorizedAmountUsdt,
  "50",
);

const authorityBearing =
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.filter(
    (entry) =>
      entry.authority !==
      DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
  );

assert.equal(authorityBearing.length, 1);
assert.equal(
  authorityBearing[0]?.key,
  "financier",
);

const reviewOriented =
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.filter(
    (entry) =>
      entry.accessPurpose !==
      DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.ACTIVE_RESPONSE,
  );

assert.equal(reviewOriented.length, 4);

for (const entry of reviewOriented) {
  assert.equal(
    entry.authority,
    DIGITAL_SETTLEMENT_V2_AUTHORITY.NONE,
  );
  assert.equal(
    entry.authorizedAmountUsdt,
    null,
  );
}

const corey =
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.find(
    (entry) =>
      entry.key === "buyerRepresentative",
  );

assert.ok(corey);
assert.equal(corey.recipientName, "Corey Keller");
assert.equal(
  corey.email,
  "corey@inderakshgold.com",
);
assert.equal(
  corey.accessPurpose,
  DIGITAL_SETTLEMENT_V2_ACCESS_PURPOSE.REVIEW,
);
assert.equal(
  corey.recipientRole,
  INSTRUMENT_PARTY_ROLE.COMMERCIAL_PARTICIPANT,
);

const hinds =
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.find(
    (entry) =>
      entry.key === "externalReviewer",
  );

assert.ok(hinds);
assert.equal(
  hinds.recipientName,
  "Dr. Don C. Hinds",
);
assert.equal(
  hinds.email,
  "DHinds@ibosed.com",
);
assert.equal(
  hinds.recipientRole,
  INSTRUMENT_PARTY_ROLE.REVIEWER,
);

const keys = new Set(
  DIGITAL_SETTLEMENT_V2_ACCESS_PLAN.map(
    (entry) => entry.key,
  ),
);

assert.equal(keys.size, 5);

console.log(
  "DIGITAL_SETTLEMENT_V2_ACCESS_PLAN_OK",
);
console.log(
  "ONE_ACTIVE_FINANCIER_FOUR_REVIEW_RECIPIENTS_OK",
);
console.log(
  "ALL_V2_ACCESS_VERSION_BOUND_OK",
);
console.log(
  "ALL_V2_GRANTS_LEAST_PRIVILEGE_VIEW_OK",
);
console.log(
  "ONLY_FINANCIER_HAS_VERIFICATION_TRANSFER_AUTHORITY_OK",
);
