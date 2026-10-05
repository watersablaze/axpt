import assert from "node:assert/strict";

import {
  projectFrenchWardInstitutionalProfile,
} from "../../src/domains/institutions/french-ward";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  adaptFrenchWardInstitutionalProfileComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function main() {
  const projection =
    projectFrenchWardInstitutionalProfile();

  const descriptor =
    adaptFrenchWardInstitutionalProfileComposition(
      projection,
    );

  assert.equal(
    descriptor.module,
    COMMERCIAL_UTILITY_PACK_MODULE
      .REPRESENTATION,
  );

  assert.equal(
    descriptor.resourceType,
    COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
      .STRUCTURED_CONTENT,
  );

  assert.equal(
    descriptor.sourceKind,
    COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
      .STRUCTURED_PROJECTION,
  );

  assert.equal(
    descriptor.projectionKey,
    COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .FRENCH_WARD_INSTITUTIONAL_PROFILE,
  );

  assert.equal(
    descriptor.sourceId,
    "FW-PROFILE-2026-001",
  );

  assert.equal(
    descriptor.sourceReference,
    "FW-PROFILE-2026-001",
  );

  assert.equal(
    descriptor.label,
    "French-Ward Institutional Profile",
  );

  console.log(
    "✓ French-Ward institutional profile maps to CUP Representation",
  );

  const serialized =
    JSON.stringify(
      descriptor,
    );

  for (const forbidden of [
    "BAF-SAI-2026-001",
    "BAF-PROFILE-MALI-2026-002",
    "Inderaksh",
    "LBMA",
    "USDT",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      `descriptor must not carry relationship or transaction truth: ${forbidden}`,
    );
  }

  console.log(
    "✓ CUP descriptor carries identity only, not institutional profile content",
  );

  console.log(
    "CUP_1E_FRENCH_WARD_PROFILE_COMPOSITION_OK",
  );
}

main();
