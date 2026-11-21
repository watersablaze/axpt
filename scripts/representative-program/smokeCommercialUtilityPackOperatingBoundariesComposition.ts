import assert from "node:assert/strict";

import {
  REPRESENTATIVE_OPERATING_BOUNDARIES,
  REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS,
  projectRepresentativeOperatingBoundaries,
  type RepresentativeOperatingBoundariesProjection,
} from "../../src/domains/instruments/representative-program";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  adaptRepresentativeOperatingBoundariesComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function main() {
  const projection =
    projectRepresentativeOperatingBoundaries();

  const descriptor =
    adaptRepresentativeOperatingBoundariesComposition(
      projection,
    );

  assert.equal(
    descriptor.module,
    COMMERCIAL_UTILITY_PACK_MODULE
      .OPERATING_BOUNDARIES,
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
      .OPERATING_BOUNDARIES,
  );

  assert.equal(
    descriptor.sourceId,
    "FW-RP-BOUNDARIES-2026-001",
  );

  assert.equal(
    descriptor.sourceReference,
    "FW-RP-BOUNDARIES-2026-001",
  );

  assert.equal(
    descriptor.label,
    "Representative Operating Boundaries",
  );

  console.log(
    "✓ CURRENT Operating Boundaries map to CUP Operating Boundaries",
  );

  for (const status of [
    REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
      .SUPERSEDED,

    REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
      .WITHDRAWN,
  ]) {
    assert.throws(
      () =>
        adaptRepresentativeOperatingBoundariesComposition({
          ...REPRESENTATIVE_OPERATING_BOUNDARIES,
          status,
        } as RepresentativeOperatingBoundariesProjection),

      /CUP_OPERATING_BOUNDARIES_NOT_CURRENT/,
    );
  }

  console.log(
    "✓ SUPERSEDED and WITHDRAWN Operating Boundaries rejected",
  );

  const serialized =
    JSON.stringify(
      descriptor,
    );

  for (const forbidden of [
    "ARP.PRESENTATION",
    "ARP.NEGOTIATION",
    "ARP.BINDING_AUTHORITY",
    "RECORDED_AUTHORITY",
    "RECORDED_AUTHORITY_AND_APPROVAL",
    "allowed",
    "exercisable",
    "authorityClass",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      `CUP descriptor must not copy operating-policy or live-authority content: ${forbidden}`,
    );
  }

  console.log(
    "✓ CUP descriptor carries policy identity only, not boundary content or authority state",
  );

  console.log(
    "CUP_1E_OPERATING_BOUNDARIES_COMPOSITION_OK",
  );
}

main();
