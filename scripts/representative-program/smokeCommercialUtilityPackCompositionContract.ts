import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  assertCommercialUtilityPackCompositionDescriptor,
  toCommercialUtilityPackResourceIdentity,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function main() {
  const masterAgreement = {
    module:
      COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS,

    resourceType:
      COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
        .INSTITUTIONAL_INSTRUMENT,

    sourceKind:
      COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
        .INSTITUTIONAL_INSTRUMENT,

    projectionKey:
      COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
        .REPRESENTATIVE_MASTER_AGREEMENT,

    sourceId:
      "instrument-master-agreement-1",

    sourceReference:
      "FWI-26-RP-ONB-CFCC47E131-MA",

    label:
      "Representative Program Master Agreement",
  } as const;

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackCompositionDescriptor(
      masterAgreement,
    ),
  );

  assert.deepEqual(
    toCommercialUtilityPackResourceIdentity(
      masterAgreement,
    ),
    {
      resourceType:
        "INSTITUTIONAL_INSTRUMENT",
      resourceId:
        "instrument-master-agreement-1",
    },
  );

  const sourceAuthority = {
    module:
      COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS,

    resourceType:
      COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
        .INSTITUTIONAL_INSTRUMENT,

    sourceKind:
      COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
        .INSTITUTIONAL_INSTRUMENT,

    projectionKey:
      COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
        .SOURCE_AUTHORITY_PRESENTATION,

    sourceId:
      "source-authority-instrument-1",

    sourceReference:
      "BAF-SAI-2026-001",

    label:
      "Bafoula Source Authority",
  } as const;

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackCompositionDescriptor(
      sourceAuthority,
    ),
  );

  const institutionalProfile = {
    module:
      COMMERCIAL_UTILITY_PACK_MODULE.REPRESENTATION,

    resourceType:
      COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
        .STRUCTURED_CONTENT,

    sourceKind:
      COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
        .STRUCTURED_PROJECTION,

    projectionKey:
      COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
        .FRENCH_WARD_INSTITUTIONAL_PROFILE,

    sourceId:
      "french-ward-institutional-profile",

    sourceReference:
      null,

    label:
      "French-Ward Institutional Profile",
  } as const;

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackCompositionDescriptor(
      institutionalProfile,
    ),
  );

  const commercialParameters = {
    module:
      COMMERCIAL_UTILITY_PACK_MODULE
        .COMMERCIAL_PARAMETERS,

    resourceType:
      COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
        .STRUCTURED_CONTENT,

    sourceKind:
      COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
        .STRUCTURED_PROJECTION,

    projectionKey:
      COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
        .COMMERCIAL_PARAMETERS,

    sourceId:
      "commercial-parameters-pending-source",

    sourceReference:
      null,

    label:
      "Commercial Parameters",
  } as const;

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackCompositionDescriptor(
      commercialParameters,
    ),
  );

  const operatingBoundaries = {
    module:
      COMMERCIAL_UTILITY_PACK_MODULE
        .OPERATING_BOUNDARIES,

    resourceType:
      COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
        .STRUCTURED_CONTENT,

    sourceKind:
      COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
        .STRUCTURED_PROJECTION,

    projectionKey:
      COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
        .OPERATING_BOUNDARIES,

    sourceId:
      "representative-operating-boundaries",

    sourceReference:
      null,

    label:
      "Operating Boundaries",
  } as const;

  assert.doesNotThrow(() =>
    assertCommercialUtilityPackCompositionDescriptor(
      operatingBoundaries,
    ),
  );

  assert.throws(
    () =>
      assertCommercialUtilityPackCompositionDescriptor({
        ...masterAgreement,

        module:
          COMMERCIAL_UTILITY_PACK_MODULE
            .REPRESENTATION,
      }),
    /CUP_COMPOSITION_MASTER_AGREEMENT_SHAPE_INVALID/,
  );

  assert.throws(
    () =>
      assertCommercialUtilityPackCompositionDescriptor({
        ...sourceAuthority,

        resourceType:
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .DOCUMENT,
      }),
    /CUP_COMPOSITION_SOURCE_AUTHORITY_SHAPE_INVALID/,
  );

  assert.throws(
    () =>
      assertCommercialUtilityPackCompositionDescriptor({
        ...operatingBoundaries,

        sourceId:
          "",
      }),
    /CUP_COMPOSITION_SOURCE_IDENTITY_REQUIRED/,
  );

  console.log(
    "✓ Master Agreement maps to DOCUMENTS / INSTITUTIONAL_INSTRUMENT",
  );

  console.log(
    "✓ Source Authority maps to DOCUMENTS / representative presentation source",
  );

  console.log(
    "✓ Institutional Profile maps to REPRESENTATION / structured projection",
  );

  console.log(
    "✓ Commercial Parameters map to COMMERCIAL_PARAMETERS / structured projection",
  );

  console.log(
    "✓ Operating Boundaries map to OPERATING_BOUNDARIES / structured projection",
  );

  console.log(
    "✓ descriptor maps to CUP persistence identity without copying source content",
  );

  console.log(
    "CUP_1E_COMPOSITION_CONTRACT_OK",
  );
}

main();
