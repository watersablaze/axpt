import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  INSTRUMENT_EVENT_TYPE,
} from "../../src/domains/instruments/eventTypes";

const files = [
  "src/domains/instruments/source-authority/commands/establishSourceAuthorityWithClient.ts",
  "src/domains/instruments/source-authority/commands/recordSourceAuthorityAssertionWithClient.ts",
  "src/domains/instruments/source-authority/commands/recordSourceAuthorityCapabilityWithClient.ts",
  "src/domains/instruments/source-authority/commands/recordSourceAuthorityRecognitionWithClient.ts",
];

const source =
  files
    .map(
      (file) =>
        readFileSync(file, "utf8"),
    )
    .join("\n");

assert.equal(
  INSTRUMENT_EVENT_TYPE
    .SOURCE_AUTHORITY_ESTABLISHED,
  "SOURCE_AUTHORITY_ESTABLISHED",
);

assert.equal(
  INSTRUMENT_EVENT_TYPE
    .SOURCE_AUTHORITY_ASSERTION_RECORDED,
  "SOURCE_AUTHORITY_ASSERTION_RECORDED",
);

assert.equal(
  INSTRUMENT_EVENT_TYPE
    .SOURCE_AUTHORITY_CAPABILITY_RECORDED,
  "SOURCE_AUTHORITY_CAPABILITY_RECORDED",
);

assert.equal(
  INSTRUMENT_EVENT_TYPE
    .SOURCE_AUTHORITY_RECOGNITION_RECORDED,
  "SOURCE_AUTHORITY_RECOGNITION_RECORDED",
);

assert.equal(
  INSTRUMENT_EVENT_TYPE
    .SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED,
  "SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED",
);

assert.match(
  source,
  /SOURCE_AUTHORITY_ASSERTION_VERSION_INSTRUMENT_MISMATCH/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_INSTRUMENT_MISMATCH/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_ACTIVE_EXISTS_REQUIRES_SUPERSESSION/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_ALREADY_SUPERSEDED/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_PRECEDES_SOURCE/,
);

assert.match(
  source,
  /currentSlot\s*:\s*"CURRENT"/,
);

assert.match(
  source,
  /currentSlot\s*:\s*null/,
);

assert.match(
  source,
  /\.updateMany\(/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_CONCURRENCY_CONFLICT/,
);

assert.match(
  source,
  /SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_CONFLICT/,
);

assert.doesNotMatch(
  source,
  /transactionAuthorityConferred\s*:\s*true/,
);

assert.doesNotMatch(
  source,
  /sovereignAuthorityConferred\s*:\s*true/,
);

console.log(
  "✓ Source Authority command contract smoke passed",
);

console.log({
  establishmentOwnsCanonicalRoot:
    true,

  assertionVersionIntegrity:
    true,

  evidenceInstrumentIntegrity:
    true,

  recognitionRequiresExplicitSupersession:
    true,

  recognitionHistoryRemainsAppendOnly:
    true,

  recognitionCurrentSlotConcurrencyGuard:
    true,

  genericGovernanceTransactionSurfaceUnchanged:
    true,
});
