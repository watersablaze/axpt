import assert from "node:assert/strict";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "../../src/domains/instruments/contracts";

import {
  SOURCE_AUTHORITY_ASSERTION_CLASS,
  SOURCE_AUTHORITY_CAPABILITY,
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
  assertSourceAuthorityAssertion,
  assertSourceAuthorityCapability,
  assertSourceAuthorityRecognition,
  type SourceAuthorityAssertion,
  type SourceAuthorityCapability,
  type SourceAuthorityRecognition,
} from "../../src/domains/instruments/source-authority";


assert.equal(
  INSTITUTIONAL_INSTRUMENT_KIND.SOURCE_AUTHORITY,
  "SOURCE_AUTHORITY",
);


const assertion: SourceAuthorityAssertion = {
  reference:
    "BAF-SAI-2026-001:A001",

  assertionClass:
    SOURCE_AUTHORITY_ASSERTION_CLASS
      .SOURCE_AUTHORITY,

  title:
    "Source-side commodity coordination",

  statement:
    "The cooperative records source-side authority over applicable commodity relationships placed under its control.",

  scope:
    "Institutional source-side standing only.",

  transactionAuthorityConferred:
    false,

  sovereignAuthorityConferred:
    false,
};

assert.doesNotThrow(() =>
  assertSourceAuthorityAssertion(assertion),
);


const capability: SourceAuthorityCapability = {
  capabilityKey:
    SOURCE_AUTHORITY_CAPABILITY
      .COMMODITY_PREPARATION_SOURCE_COORDINATION,

  title:
    "Commodity preparation and source coordination",

  description:
    "Preparation, aggregation and source-side coordination of mineral commodities.",

  transactionAuthorityConferred:
    false,

  currentCommodityAvailabilityEstablished:
    false,
};

assert.doesNotThrow(() =>
  assertSourceAuthorityCapability(capability),
);


const recognition: SourceAuthorityRecognition = {
  instrumentId:
    "instrument-sai-smoke-001",

  assertionReference:
    assertion.reference,

  outcome:
    SOURCE_AUTHORITY_RECOGNITION_OUTCOME
      .RECOGNIZED_WITH_LIMITATION,

  evidenceIds: [
    "evidence-sai-smoke-001",
  ],

  actorUserId:
    "operator-sai-smoke-001",

  occurredAt:
    new Date("2026-10-03T00:00:00.000Z"),

  limitation:
    "Recognition is limited to source-side institutional standing and does not establish transaction-specific commodity availability.",

  reason:
    null,

  transactionAuthorityConferred:
    false,

  sovereignAuthorityConferred:
    false,
};

assert.doesNotThrow(() =>
  assertSourceAuthorityRecognition(recognition),
);


/**
 * Affirmative recognition requires evidence.
 */
assert.throws(
  () =>
    assertSourceAuthorityRecognition({
      ...recognition,
      evidenceIds: [],
    }),
  /SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_REQUIRED/,
);


/**
 * Limited recognition requires an explicit limitation.
 */
assert.throws(
  () =>
    assertSourceAuthorityRecognition({
      ...recognition,
      limitation: null,
    }),
  /SOURCE_AUTHORITY_RECOGNITION_LIMITATION_REQUIRED/,
);


/**
 * Non-recognition requires a stated reason.
 */
assert.throws(
  () =>
    assertSourceAuthorityRecognition({
      ...recognition,

      outcome:
        SOURCE_AUTHORITY_RECOGNITION_OUTCOME
          .NOT_RECOGNIZED,

      evidenceIds: [],

      limitation:
        null,

      reason:
        null,
    }),
  /SOURCE_AUTHORITY_NON_RECOGNITION_REASON_REQUIRED/,
);


console.log(
  "✓ Source Authority domain contract smoke passed",
);

console.log({
  instrumentKind:
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY,

  assertionRecognitionIsScoped:
    true,

  evidenceDoesNotEqualRecognition:
    true,

  recognitionDoesNotConferTransactionAuthority:
    true,

  recognitionDoesNotConferSovereignAuthority:
    true,

  capabilityDoesNotEstablishAvailability:
    true,
});
