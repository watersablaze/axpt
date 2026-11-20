import assert from "node:assert/strict";

import {
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
  FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS,
  projectFrenchWardInstitutionalProfile,
} from "../../src/domains/institutions/french-ward";

function main() {
  assert.equal(
    FRENCH_WARD_INSTITUTIONAL_PROFILE.reference,
    "FW-PROFILE-2026-001",
  );

  assert.equal(
    FRENCH_WARD_INSTITUTIONAL_PROFILE.version,
    2,
  );

  assert.equal(
    FRENCH_WARD_INSTITUTIONAL_PROFILE.status,
    FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS
      .CURRENT,
  );

  assert.equal(
    FRENCH_WARD_INSTITUTIONAL_PROFILE.legalName,
    "French-Ward, Inc.",
  );

  console.log(
    "✓ canonical French-Ward institutional identity established",
  );

  const projection =
    projectFrenchWardInstitutionalProfile();

  assert.equal(
    projection.reference,
    FRENCH_WARD_INSTITUTIONAL_PROFILE.reference,
  );

  assert.deepEqual(
    projection.domains,
    FRENCH_WARD_INSTITUTIONAL_PROFILE.domains,
  );

  assert.deepEqual(
    projection.practiceAreas,
    FRENCH_WARD_INSTITUTIONAL_PROFILE.practiceAreas,
  );

  console.log(
    "✓ representative-safe projection derives from canonical profile",
  );

  const serialized =
    JSON.stringify(
      projection,
    );

  for (const forbidden of [
    "BAF-SAI-2026-001",
    "BAF-PROFILE-MALI-2026-002",
    "Inderaksh",
    "FWI-26-RP-001",
    "commodity allocation",
    "LBMA",
    "USDT",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      `profile must not contain relationship/transaction-specific truth: ${forbidden}`,
    );
  }

  assert.equal(
    projection.establishedSourceRelationships.length,
    3,
  );

  assert.match(
    projection.establishedSourceRelationships[0],
    /Coopérative de Bafoula/,
  );

  assert.match(
    projection.establishedSourceRelationships[2],
    /governed by their respective instruments/,
  );

  console.log(
    "✓ qualified source relationship disclosed without instrument-specific authority or transaction terms",
  );

  assert.ok(
    projection.operatingPrinciples.includes(
      "Authority must be attributable to an identifiable source and supported by appropriate records.",
    ),
  );

  assert.ok(
    projection.operatingContinuum.includes(
      "Delivery & Passage",
    ),
  );

  console.log(
    "✓ stable operating architecture retained",
  );

  console.log(
    "FRENCH_WARD_INSTITUTIONAL_PROFILE_FOUNDATION_OK",
  );
}

main();
