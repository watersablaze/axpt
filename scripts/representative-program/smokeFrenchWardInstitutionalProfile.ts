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
    1,
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
    "authorized reseller",
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

  console.log(
    "✓ relationship-specific and transaction-specific truth excluded",
  );

  assert.ok(
    projection.operatingPrinciples.includes(
      "Authority must be attributable.",
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
