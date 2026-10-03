import assert from "node:assert/strict";

import {
  BAFOULA_RECOGNITION_PLAN,
} from "../../src/domains/instruments/source-authority/recognition/bafoulaRecognitionPlan";

const plan =
  BAFOULA_RECOGNITION_PLAN;

assert.equal(
  plan.instrumentReference,
  "BAF-SAI-2026-001",
);

assert.equal(
  plan.sourceProfileReference,
  "BAF-PROFILE-MALI-2026-002",
);

assert.equal(
  plan.executionAuthorized,
  false,
  "RECOGNITION_PLAN_MUST_NOT_SELF_AUTHORIZE_EXECUTION",
);

assert.equal(
  plan.items.length,
  6,
);

const byReference =
  new Map(
    plan.items.map(
      (item) => [
        item.assertionReference,
        item,
      ],
    ),
  );

for (
  const reference
  of [
    "A001",
    "A002",
    "A003",
    "A004",
    "A005",
    "A006",
  ] as const
) {
  assert.ok(
    byReference.has(reference),
    `MISSING_RECOGNITION_PLAN_ITEM:${reference}`,
  );
}

for (
  const reference
  of [
    "A001",
    "A002",
    "A003",
    "A005",
  ] as const
) {
  const item =
    byReference.get(reference);

  assert.ok(item);

  assert.equal(
    item.disposition,
    "CANDIDATE_RECOGNITION",
  );

  assert.equal(
    item.outcome,
    "RECOGNIZED_WITH_LIMITATION",
  );

  assert.equal(
    item.evidenceRequired,
    true,
  );

  assert.equal(
    item.operatorDecisionRequired,
    true,
  );

  assert.ok(
    item.limitation.length > 0,
  );
}

const a004 =
  byReference.get("A004");

assert.ok(a004);

assert.equal(
  a004.disposition,
  "HOLD_FOR_ADDITIONAL_EVIDENCE",
);

assert.equal(
  a004.outcome,
  null,
);

assert.equal(
  a004.operatorDecisionRequired,
  true,
);

const a006 =
  byReference.get("A006");

assert.ok(a006);

assert.equal(
  a006.disposition,
  "INTERNAL_INSTRUMENT_DOCTRINE",
);

assert.equal(
  a006.outcome,
  null,
);

assert.equal(
  a006.evidenceRequired,
  false,
);

assert.equal(
  a006.operatorDecisionRequired,
  false,
);

console.log(
  "✓ Bafoula recognition plan smoke passed",
);

console.log({
  executionAuthorized:
    plan.executionAuthorized,

  candidateRecognitions:
    plan.items.filter(
      (item) =>
        item.disposition ===
        "CANDIDATE_RECOGNITION",
    ).map(
      (item) =>
        item.assertionReference,
    ),

  heldForAdditionalEvidence:
    plan.items.filter(
      (item) =>
        item.disposition ===
        "HOLD_FOR_ADDITIONAL_EVIDENCE",
    ).map(
      (item) =>
        item.assertionReference,
    ),

  internalDoctrine:
    plan.items.filter(
      (item) =>
        item.disposition ===
        "INTERNAL_INSTRUMENT_DOCTRINE",
    ).map(
      (item) =>
        item.assertionReference,
    ),
});
