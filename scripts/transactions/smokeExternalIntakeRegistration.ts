import assert from "node:assert/strict";

import {
  prepareExternalIntakeRegistration,
} from "../../src/domains/control-center/transaction-intakes/externalIntakeRegistration";

const candidate = {
  operationalReference: "FW-TXN-2026-001",
  operatorEmail: "operator@example.test",

  source: "EXTERNAL_EMAIL" as const,
  sourceEvidenceReference: "ZKKM-LEGACY-LOI",
  sourceEvidenceSha256: "a".repeat(64),

  submitterName: "Enver Gonuler",
  submitterEmail: "enver@example.test",
  submitterRole: "INTERMEDIARY_UNVERIFIED",

  buyerName: "ZKKM BULLION TRADING - FZCO",
  commodity: "Gold Doré",
  trialQuantity: "50 kg",
  monthlyQuantity: "50–100 kg",
  destination: "United Arab Emirates",

  originatingCandidateName: "Mark",

  deliveryTerms:
    "Buyer proposes Dubai refinery delivery at seller cost and risk; not accepted.",

  settlementMethod:
    "USD bank transfer proposed; escrow capability declared, unverified.",
};

const result = prepareExternalIntakeRegistration(candidate);

assert.equal(result.intake.status, "SUBMITTED");
assert.equal(result.intake.referredByName, "Mark");
assert.equal(result.intake.referralConfirmed, false);
assert.equal(result.intake.authorityToRepresent, false);
assert.equal(result.intake.authorityToSign, false);

assert.deepEqual(
  Object.values(result.effects),
  Array(Object.keys(result.effects).length).fill(false),
);

assert.throws(
  () =>
    prepareExternalIntakeRegistration({
      ...candidate,
      submitterEmail: "",
    }),
  /FW_TXN_REQUIRED:submitterEmail/,
);

assert.throws(
  () =>
    prepareExternalIntakeRegistration({
      ...candidate,
      sourceEvidenceSha256: "",
    }),
  /FW_TXN_REQUIRED:sourceEvidenceSha256/,
);

console.log(
  "PASS: FW-TXN-1A mapping and no-side-effect contract",
);
