import assert from "node:assert/strict";

import {
  readExternalIntakeProvenance,
} from "../../src/domains/control-center/transaction-intakes/readExternalIntakeProvenance";

const base = {
  requestFingerprint: "b".repeat(64),
  registrationMode: "OPERATOR_EXTERNAL_IMPORT",
  operationalReference: "FW-TXN-ZKKM-TEST",
  evidenceReference: "private/custody/reference",
  evidenceSha256: "a".repeat(64),
  originator: "Mark",
};

const legacy = readExternalIntakeProvenance(
  JSON.stringify({ ...base, version: 1 }),
);

assert.equal(legacy?.originator, "Mark");
assert.equal(legacy?.introductionChannelName, null);
assert.equal(legacy?.version, 1);

const extended = readExternalIntakeProvenance(
  JSON.stringify({
    ...base,
    version: 2,
    introductionChannelName: "Enver Gonuler",
  }),
);

assert.equal(extended?.originator, "Mark");
assert.equal(extended?.introductionChannelName, "Enver Gonuler");
assert.equal(extended?.evidenceSha256, "a".repeat(64));

assert.equal(readExternalIntakeProvenance(null), null);
assert.equal(readExternalIntakeProvenance("not JSON"), null);
assert.equal(
  readExternalIntakeProvenance(
    JSON.stringify({ ...base, version: 3 }),
  ),
  null,
);
assert.equal(
  readExternalIntakeProvenance(
    JSON.stringify({ ...base, version: 2, evidenceSha256: "bad" }),
  ),
  null,
);

console.log("PASS: legacy and extended intake provenance presentation");
console.log("PASS: malformed provenance rejected safely");
