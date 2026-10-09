import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  projectFrenchWardInstitutionalProfile,
} from "../../src/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";

import {
  projectPublicFrenchWardProfile,
} from "../../src/domains/institutions/french-ward/projectPublicFrenchWardProfile";

const full = projectFrenchWardInstitutionalProfile();
const pub = projectPublicFrenchWardProfile();

assert.equal(full.reference, "FW-PROFILE-2026-001");
assert.equal(full.version, 2);
assert.equal(full.status, "CURRENT");
assert.equal(pub.reference, full.reference);
assert.equal(pub.version, full.version);

for (const field of [
  "legalName",
  "displayName",
  "classification",
  "publicDescription",
  "orientation",
  "custodianshipThesis",
] as const) {
  assert.equal(pub[field], full[field]);
}

assert.deepEqual(pub.domains, full.domains);
assert.deepEqual(pub.practiceAreas, full.practiceAreas);
assert.deepEqual(
  pub.transactionPreparation,
  full.transactionPreparation,
);

assert.equal(full.domains.length, 5);
assert.equal(full.practiceAreas.length, 5);
assert.equal(full.operatingPrinciples.length, 6);
assert.equal(full.operatingContinuum.length, 6);

assert.deepEqual(full.transactionPreparation, [
  "Intake",
  "Review",
  "Qualification",
  "Dossier",
  "Execution",
]);

assert.equal(
  full.establishedSourceRelationships.length,
  3,
);

const publicKeys = Object.keys(pub).sort();

assert.deepEqual(publicKeys, [
  "reference",
  "version",
  "legalName",
  "displayName",
  "classification",
  "publicDescription",
  "orientation",
  "custodianshipThesis",
  "transactionPreparation",
  "domains",
  "practiceAreas",
].sort());

for (const forbidden of [
  "establishedSourceRelationships",
  "institutionalDefinition",
  "operatingPrinciples",
  "operatingContinuum",
  "status",
]) {
  assert.equal(
    Object.hasOwn(pub, forbidden),
    false,
  );
}

assert.match(
  full.establishedSourceRelationships[0],
  /Coopérative de Bafoula/,
);

assert.match(
  full.establishedSourceRelationships[2],
  /governed by their respective instruments/,
);

assert.match(
  full.custodianshipThesis,
  /commercial responsibility/,
);

const folio = readFileSync(
  "src/components/french-ward/FWLaunchBody.tsx",
  "utf8",
);

assert.match(folio, /profile\.custodianshipThesis/);
assert.match(folio, /profile\.transactionPreparation\.map/);
assert.doesNotMatch(folio, /const progression =/);
assert.doesNotMatch(folio, /Coopérative de Bafoula/);

const viewer = readFileSync(
  "src/components/french-ward/profile/FrenchWardInstitutionalProfileView.tsx",
  "utf8",
);

assert.match(
  viewer,
  /profile\.establishedSourceRelationships\.map/,
);

assert.match(
  viewer,
  /profile\.transactionPreparation\.map/,
);

assert.match(viewer, /downloadHref &&/);

const loader = readFileSync(
  "src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient.ts",
  "utf8",
);

assert.match(loader, /projectFrenchWardInstitutionalProfile\(\)/);
assert.match(loader, /content\.status !== "CURRENT"/);
assert.match(loader, /content\.reference !== resource\.resourceId/);

console.log("FW_PROFILE_EDITION_2_RELEASE_CONTRACT_OK");
console.log("✓ canonical and public editions agree");
console.log("✓ Bafoula narrative excluded from public projection");
console.log("✓ public progression derives from canonical stages");
console.log("✓ institutional registers and sequences preserved");
console.log("✓ CUP CURRENT and resource-reference checks retained");
