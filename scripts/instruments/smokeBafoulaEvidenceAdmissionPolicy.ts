import assert from "node:assert/strict";

import {
  BAFOULA_SOURCE_PROFILE_EVIDENCE,
} from "../../src/domains/instruments/source-authority/evidence/bafoulaEvidenceAdmissionMatrix";

const matrix =
  BAFOULA_SOURCE_PROFILE_EVIDENCE;

assert.equal(
  matrix.documentReference,
  "BAF-PROFILE-MALI-2026-002",
);

assert.equal(
  matrix.evidenceType,
  "DOCUMENT",
);

assert.equal(
  matrix.subjectType,
  "INSTRUMENT",
);

assert.equal(
  matrix.assertionAdmission.length,
  6,
);

assert.deepEqual(
  matrix.assertionAdmission.map(
    (item) =>
      item.assertionReference,
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

const a004 =
  matrix.assertionAdmission.find(
    (item) =>
      item.assertionReference ===
      "A004",
  );

assert.ok(a004);

assert.equal(
  a004.suggestedOutcome,
  null,
);

assert.match(
  a004.limitation,
  /governing authority instrument is required/i,
);

const a006 =
  matrix.assertionAdmission.find(
    (item) =>
      item.assertionReference ===
      "A006",
  );

assert.ok(a006);

assert.equal(
  a006.admissible,
  false,
);

assert.ok(
  matrix.assertionAdmission.every(
    (item) =>
      item.sufficientForUnqualifiedRecognition ===
      false,
  ),
);

console.log(
  "✓ Bafoula evidence admission policy smoke passed",
);

console.log({
  profileEvidenceType:
    matrix.evidenceType,

  profileSubjectType:
    matrix.subjectType,

  admissibleAssertions:
    matrix.assertionAdmission
      .filter(
        (item) =>
          item.admissible,
      )
      .map(
        (item) =>
          item.assertionReference,
      ),

  a004RequiresUnderlyingAuthorityInstrument:
    true,

  a006UsesExternalProfileEvidence:
    false,

  evidenceImpliesRecognition:
    false,
});
