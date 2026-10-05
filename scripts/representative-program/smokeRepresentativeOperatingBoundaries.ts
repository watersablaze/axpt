import assert from "node:assert/strict";

import {
  REPRESENTATIVE_AUTHORITY_KEY,
  REPRESENTATIVE_OPERATING_BOUNDARIES,
  REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS,
  REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT,
  projectRepresentativeOperatingBoundaries,
} from "../../src/domains/instruments/representative-program";

function byKey(key: string) {
  const boundary =
    projectRepresentativeOperatingBoundaries()
      .boundaries
      .find((item) => item.key === key);

  assert.ok(
    boundary,
    `boundary missing: ${key}`,
  );

  return boundary;
}

function main() {
  assert.equal(
    REPRESENTATIVE_OPERATING_BOUNDARIES.reference,
    "FW-RP-BOUNDARIES-2026-001",
  );

  assert.equal(
    REPRESENTATIVE_OPERATING_BOUNDARIES.version,
    1,
  );

  assert.equal(
    REPRESENTATIVE_OPERATING_BOUNDARIES.status,
    REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
      .CURRENT,
  );

  console.log(
    "✓ canonical Representative Operating Boundaries established",
  );

  assert.equal(
    byKey("PRESENT_RELEASED_MATERIALS")
      .authorityKey,
    REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION,
  );

  assert.equal(
    byKey("NEGOTIATE_COMMERCIAL_TERMS")
      .authorityKey,
    REPRESENTATIVE_AUTHORITY_KEY.NEGOTIATION,
  );

  assert.equal(
    byKey("NEGOTIATE_COMMERCIAL_TERMS")
      .requirement,
    REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
      .RECORDED_AUTHORITY_AND_APPROVAL,
  );

  assert.equal(
    byKey("BIND_FRENCH_WARD")
      .authorityKey,
    REPRESENTATIVE_AUTHORITY_KEY.BINDING_AUTHORITY,
  );

  assert.equal(
    byKey("SUBDELEGATE_AUTHORITY")
      .requirement,
    REPRESENTATIVE_OPERATING_BOUNDARY_REQUIREMENT
      .WRITTEN_AUTHORIZATION,
  );

  console.log(
    "✓ operating actions map to canonical ARP authority dependencies",
  );

  const serialized =
    JSON.stringify(
      projectRepresentativeOperatingBoundaries(),
    );

  for (const forbidden of [
    '"allowed":true',
    '"exercisable":true',
    '"authorityClass":"DELEGATED"',
    '"authorityClass":"JOINT"',
    '"authorityClass":"RESERVED"',
    '"authorityClass":"PROHIBITED"',
    "Inderaksh",
    "BAF-SAI-2026-001",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      `policy must not manufacture live authority state: ${forbidden}`,
    );
  }

  console.log(
    "✓ policy does not manufacture authority class or exercisability",
  );

  assert.match(
    byKey("COMMUNICATE_APPROVED_INFORMATION")
      .representativeInstruction,
    /Do not invent or extend commercial terms/,
  );

  assert.match(
    byKey("BIND_FRENCH_WARD")
      .representativeInstruction,
    /separately recorded and presently exercisable/,
  );

  console.log(
    "✓ onboarding conduct floor preserved in representative policy",
  );

  console.log(
    "REPRESENTATIVE_OPERATING_BOUNDARIES_FOUNDATION_OK",
  );
}

main();
