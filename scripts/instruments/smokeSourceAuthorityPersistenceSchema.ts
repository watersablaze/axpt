import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema =
  readFileSync(
    "prisma/schema.prisma",
    "utf8",
  );

function requirePattern(
  pattern: RegExp,
  code: string,
): void {
  assert.match(
    schema,
    pattern,
    code,
  );
}

requirePattern(
  /SOURCE_AUTHORITY\s*\n\s*GENERAL/,
  "SOURCE_AUTHORITY_INSTRUMENT_KIND_MISSING",
);

requirePattern(
  /model SourceAuthorityRecord \{/,
  "SOURCE_AUTHORITY_RECORD_MODEL_MISSING",
);

requirePattern(
  /instrumentId\s+String\s+@unique/,
  "SOURCE_AUTHORITY_RECORD_NOT_ONE_TO_ONE",
);

requirePattern(
  /model SourceAuthorityAssertion \{/,
  "SOURCE_AUTHORITY_ASSERTION_MODEL_MISSING",
);

requirePattern(
  /versionId\s+String/,
  "SOURCE_AUTHORITY_ASSERTION_NOT_VERSION_BOUND",
);

requirePattern(
  /@@unique\(\[versionId, reference\]\)/,
  "SOURCE_AUTHORITY_ASSERTION_REFERENCE_NOT_VERSION_SCOPED",
);

requirePattern(
  /@@unique\(\[versionId, ordinal\]\)/,
  "SOURCE_AUTHORITY_ASSERTION_ORDINAL_NOT_VERSION_SCOPED",
);

requirePattern(
  /model SourceAuthorityCapability \{/,
  "SOURCE_AUTHORITY_CAPABILITY_MODEL_MISSING",
);

requirePattern(
  /@@unique\(\[assertionId, capabilityKey\]\)/,
  "SOURCE_AUTHORITY_CAPABILITY_NOT_ASSERTION_SCOPED",
);

requirePattern(
  /model SourceAuthorityRecognition \{/,
  "SOURCE_AUTHORITY_RECOGNITION_MODEL_MISSING",
);

requirePattern(
  /assertionId\s+String/,
  "SOURCE_AUTHORITY_RECOGNITION_NOT_ASSERTION_SCOPED",
);

requirePattern(
  /supersedesRecognitionId\s+String\?\s+@unique/,
  "SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_MISSING",
);

requirePattern(
  /enum SourceAuthorityRecognitionCurrentSlot \{\s*CURRENT\s*\}/s,
  "SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_ENUM_MISSING",
);

requirePattern(
  /currentSlot\s+SourceAuthorityRecognitionCurrentSlot\?/,
  "SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_FIELD_MISSING",
);

requirePattern(
  /@@unique\(\[assertionId, currentSlot\]\)/,
  "SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_NOT_ASSERTION_SCOPED",
);

requirePattern(
  /model SourceAuthorityRecord \{[\s\S]*?instrument\s+InstitutionalInstrument\s+@relation\([^\n]*onDelete:\s*Restrict\)/,
  "SOURCE_AUTHORITY_ROOT_MUST_RESTRICT_INSTRUMENT_DELETION",
);

requirePattern(
  /model SourceAuthorityAssertion \{[\s\S]*?version\s+InstrumentVersion\s+@relation\([^\n]*onDelete:\s*Restrict\)/,
  "SOURCE_AUTHORITY_ASSERTION_MUST_RESTRICT_VERSION_DELETION",
);

requirePattern(
  /model SourceAuthorityRecognitionEvidence \{[\s\S]*?evidence\s+InstrumentEvidence\s+@relation\([^\n]*onDelete:\s*Restrict\)/,
  "SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_MUST_RESTRICT_EVIDENCE_DELETION",
);

requirePattern(
  /model SourceAuthorityRecognitionEvidence \{/,
  "SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_MODEL_MISSING",
);

requirePattern(
  /@@id\(\[recognitionId, evidenceId\]\)/,
  "SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_NOT_UNIQUE",
);

/**
 * These are constitutional domain invariants.
 * They must not become mutable persistence switches.
 */
for (
  const forbidden of [
    "transactionAuthorityConferred",
    "sovereignAuthorityConferred",
    "currentCommodityAvailabilityEstablished",
  ]
) {
  assert.equal(
    schema.includes(forbidden),
    false,
    `FORBIDDEN_SOURCE_AUTHORITY_BOOLEAN_PERSISTED:${forbidden}`,
  );
}

/**
 * Presentation standing is derived, not stored.
 */
assert.equal(
  schema.includes(
    "SourceAuthorityPresentationStanding",
  ),
  false,
  "SOURCE_AUTHORITY_PRESENTATION_STANDING_MUST_REMAIN_DERIVED",
);

console.log(
  "✓ Source Authority persistence schema smoke passed",
);

console.log({
  specializedRootIsOneToOne:
    true,

  assertionsAreVersionBound:
    true,

  capabilitiesAreAssertionScoped:
    true,

  recognitionIsAssertionScoped:
    true,

  recognitionHistoryIsSupersessionAware:
    true,

  recognitionCurrentSlotIsAssertionScoped:
    true,

  sourceAuthorityArchiveIsDeletionProtected:
    true,

  evidenceRemainsCanonicalInstrumentEvidence:
    true,

  forbiddenAuthorityBooleansAreNotPersisted:
    true,

  presentationStandingRemainsDerived:
    true,
});

requirePattern(
  /model SourceAuthorityEvidenceAdmission \{/,
  "SOURCE_AUTHORITY_EVIDENCE_ADMISSION_MODEL_MISSING",
);

requirePattern(
  /@@unique\(\[sourceAuthorityId, evidenceRole\]\)/,
  "SOURCE_AUTHORITY_EVIDENCE_ROLE_SLOT_NOT_UNIQUE",
);

requirePattern(
  /@@index\(\[sourceAuthorityId, admissionKey\]\)/,
  "SOURCE_AUTHORITY_EVIDENCE_ADMISSION_KEY_NOT_INDEXED",
);

requirePattern(
  /evidenceId\s+String\?\s+@unique/,
  "SOURCE_AUTHORITY_EVIDENCE_ADMISSION_EVIDENCE_NOT_SINGULAR",
);

requirePattern(
  /sourceAuthority\s+SourceAuthorityRecord\s+@relation\([^\n]*onDelete:\s*Cascade\)/,
  "SOURCE_AUTHORITY_EVIDENCE_ADMISSION_ROOT_OWNERSHIP_INVALID",
);

requirePattern(
  /evidence\s+InstrumentEvidence\?\s+@relation\([^\n]*onDelete:\s*Restrict\)/,
  "SOURCE_AUTHORITY_EVIDENCE_ADMISSION_EVIDENCE_DELETE_MUST_RESTRICT",
);
