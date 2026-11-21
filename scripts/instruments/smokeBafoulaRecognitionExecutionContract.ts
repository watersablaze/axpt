import assert from "node:assert/strict";
import fs from "node:fs";

import {
  BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS,
} from "../../src/domains/instruments/source-authority/recognition/executeBafoulaProfileRecognitionWithClient";

import {
  BAFOULA_RECOGNITION_PLAN,
} from "../../src/domains/instruments/source-authority/recognition/bafoulaRecognitionPlan";

const executorPath =
  "src/domains/instruments/source-authority/recognition/executeBafoulaProfileRecognitionWithClient.ts";

const executor =
  fs.readFileSync(
    executorPath,
    "utf8",
  );

assert.deepEqual(
  [
    ...BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS,
  ],
  [
    "A001",
    "A003",
    "A005",
  ],
);

assert.equal(
  BAFOULA_RECOGNITION_PLAN
    .executionAuthorized,
  false,
  "PLAN_MUST_REMAIN_NON_SELF-AUTHORIZING",
);

const authorized =
  new Set(
    BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS,
  );

assert.equal(
  authorized.has("A002" as never),
  false,
);

assert.equal(
  authorized.has("A004" as never),
  false,
);

assert.equal(
  authorized.has("A006" as never),
  false,
);

for (
  const reference
  of BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS
) {
  const item =
    BAFOULA_RECOGNITION_PLAN
      .items
      .find(
        (candidate) =>
          candidate.assertionReference ===
          reference,
      );

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
    item.operatorDecisionRequired,
    true,
  );

  assert.ok(
    item.limitation.length > 0,
  );
}

assert.match(
  executor,
  /sourceAuthorityEvidenceAdmission/,
);

assert.match(
  executor,
  /sourceAuthorityId_evidenceRole/,
);

assert.match(
  executor,
  /BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE/,
);

assert.match(
  executor,
  /recordSourceAuthorityRecognitionWithClient/,
);

assert.match(
  executor,
  /evidenceIds:\s*\[\s*evidence\.id/,
);

assert.match(
  executor,
  /item\.limitation/,
);

assert.doesNotMatch(
  executor,
  /"A002",\s*"A004"/,
);

assert.doesNotMatch(
  executor,
  /transactionAuthorityConferred\s*:\s*true/,
);

assert.doesNotMatch(
  executor,
  /sovereignAuthorityConferred\s*:\s*true/,
);

console.log(
  "✓ Bafoula recognition execution contract smoke passed",
);

console.log({
  authorizedRecognitionScope:
    [
      ...BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS,
    ],

  held:
    [
      "A002",
      "A004",
    ],

  internalOnly:
    [
      "A006",
    ],

  outcome:
    "RECOGNIZED_WITH_LIMITATION",

  canonicalEvidenceRequired:
    true,

  transactionAuthorityConferred:
    false,

  sovereignAuthorityConferred:
    false,
});
