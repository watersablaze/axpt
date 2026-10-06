import assert from "node:assert/strict";

import {
  BAFOULA_SOURCE_AUTHORITY_MANIFEST,
} from "../../src/domains/instruments/source-authority/seeds/bafoulaCanonicalManifest";

const manifest =
  BAFOULA_SOURCE_AUTHORITY_MANIFEST;

assert.equal(
  manifest.instrument.reference,
  "BAF-SAI-2026-001",
);

assert.equal(
  manifest.sourceProfile.documentReference,
  "BAF-PROFILE-MALI-2026-002",
);

assert.equal(
  manifest.sourceProfile.registrationReference,
  null,
);

assert.equal(
  manifest.sourceProfile.registrationStanding,
  "PENDING_DOCUMENTARY_COMPLETION",
);

assert.deepEqual(
  manifest.subject.principalCommodityActivity,
  [
    "Gold",
    "Gold Doré",
  ],
);

assert.equal(
  manifest.assertions.length,
  6,
);

assert.deepEqual(
  manifest.assertions.map(
    (assertion) =>
      assertion.reference,
  ),
  [
    "A001",
    "A002",
    "A003",
    "A004",
    "A005",
    "A006",
  ],
);

assert.equal(
  new Set(
    manifest.assertions.map(
      (assertion) =>
        assertion.ordinal,
    ),
  ).size,
  6,
);

assert.equal(
  manifest.capabilities.length,
  6,
);

assert.ok(
  manifest.capabilities.every(
    (capability) =>
      capability.assertionReference ===
      "A003",
  ),
);

assert.match(
  manifest.assertions
    .find(
      (assertion) =>
        assertion.reference ===
        "A002",
    )
    ?.scope ?? "",
  /does not establish title, allocation, export authorization, transaction authority, or commodity availability/i,
);

assert.match(
  manifest.assertions
    .find(
      (assertion) =>
        assertion.reference ===
        "A006",
    )
    ?.statement ?? "",
  /does not by itself establish sovereign State authority, regulatory approval, export authorization, commodity availability, commodity allocation, title, transaction authority, or settlement authority/i,
);

console.log(
  "✓ canonical Bafoula Source Authority manifest smoke passed",
);

console.log({
  instrumentReference:
    manifest.instrument.reference,

  sourceProfileReference:
    manifest.sourceProfile.documentReference,

  registrationReferenceInvented:
    false,

  assertions:
    manifest.assertions.length,

  capabilities:
    manifest.capabilities.length,

  recognitionSeeded:
    false,

  transactionAuthorityConferred:
    false,
});
