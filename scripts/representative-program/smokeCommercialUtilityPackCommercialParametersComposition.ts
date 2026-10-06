import assert from "node:assert/strict";

import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS,
  FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS,
  FRENCH_WARD_COMMERCIAL_PARAMETER_STATE,
  type FrenchWardCommercialParametersProjection,
} from "../../src/domains/institutions/french-ward";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  adaptFrenchWardCommercialParametersComposition,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function currentProjection():
  FrenchWardCommercialParametersProjection {
  return {
    ...FRENCH_WARD_COMMERCIAL_PARAMETERS,

    status:
      FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
        .CURRENT,

    commodity: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved commodity framework",
      note:
        null,
    },

    transactionStructure: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved transaction structure",
      note:
        null,
    },

    quantityFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved quantity framework",
      note:
        null,
    },

    pricingFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved pricing framework",
      note:
        null,
    },

    deliveryFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved delivery framework",
      note:
        null,
    },

    settlementFramework: {
      state:
        FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
          .DEFINED,
      value:
        "Approved settlement framework",
      note:
        null,
    },
  };
}

function main() {
  assert.throws(
    () =>
      adaptFrenchWardCommercialParametersComposition(
        FRENCH_WARD_COMMERCIAL_PARAMETERS,
      ),

    /CUP_COMMERCIAL_PARAMETERS_NOT_CURRENT/,
  );

  console.log(
    "✓ PREPARING commercial parameters rejected at CUP boundary",
  );

  for (const status of [
    FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
      .SUPERSEDED,

    FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
      .WITHDRAWN,
  ]) {
    assert.throws(
      () =>
        adaptFrenchWardCommercialParametersComposition({
          ...currentProjection(),
          status,
        }),

      /CUP_COMMERCIAL_PARAMETERS_NOT_CURRENT/,
    );
  }

  console.log(
    "✓ SUPERSEDED and WITHDRAWN commercial parameters rejected",
  );

  const projection =
    currentProjection();

  const descriptor =
    adaptFrenchWardCommercialParametersComposition(
      projection,
    );

  assert.equal(
    descriptor.module,
    COMMERCIAL_UTILITY_PACK_MODULE
      .COMMERCIAL_PARAMETERS,
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
      .COMMERCIAL_PARAMETERS,
  );

  assert.equal(
    descriptor.sourceId,
    "FW-COMM-PARAM-2026-001",
  );

  assert.equal(
    descriptor.sourceReference,
    "FW-COMM-PARAM-2026-001",
  );

  assert.equal(
    descriptor.label,
    "French-Ward Commercial Parameters",
  );

  console.log(
    "✓ CURRENT commercial parameters map to CUP Commercial Parameters",
  );

  const serialized =
    JSON.stringify(
      descriptor,
    );

  for (const forbidden of [
    "Approved commodity framework",
    "Approved transaction structure",
    "Approved quantity framework",
    "Approved pricing framework",
    "Approved delivery framework",
    "Approved settlement framework",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      "CUP descriptor must not copy commercial parameter content",
    );
  }

  console.log(
    "✓ CUP descriptor carries source identity only, not commercial content",
  );

  console.log(
    "CUP_1E_COMMERCIAL_PARAMETERS_COMPOSITION_OK",
  );
}

main();
