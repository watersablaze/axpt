import assert from "node:assert/strict";

import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS,
  FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS,
  FRENCH_WARD_COMMERCIAL_PARAMETER_STATE,
  assertFrenchWardCommercialParameters,
  projectFrenchWardCommercialParameters,
} from "../../src/domains/institutions/french-ward";

function main() {
  assert.equal(
    FRENCH_WARD_COMMERCIAL_PARAMETERS.reference,
    "FW-COMM-PARAM-2026-001",
  );

  assert.equal(
    FRENCH_WARD_COMMERCIAL_PARAMETERS.version,
    1,
  );

  assert.equal(
    FRENCH_WARD_COMMERCIAL_PARAMETERS.status,
    FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
      .PREPARING,
  );

  console.log(
    "✓ canonical French-Ward commercial parameters source established",
  );

  const projection =
    projectFrenchWardCommercialParameters();

  for (const entry of [
    projection.commodity,
    projection.transactionStructure,
    projection.quantityFramework,
    projection.pricingFramework,
    projection.deliveryFramework,
    projection.settlementFramework,
  ]) {
    assert.equal(
      entry.state,
      FRENCH_WARD_COMMERCIAL_PARAMETER_STATE
        .UNRESOLVED,
    );

    assert.equal(
      entry.value,
      null,
    );
  }

  console.log(
    "✓ unresolved commercial fields remain explicitly unresolved",
  );

  const serialized =
    JSON.stringify(
      projection,
    );

  for (const forbidden of [
    "Inderaksh",
    "50 KG",
    "471762.40",
    "471,762.40",
    "LBMA",
    "less 10%",
    "7.5%",
    "CIP",
    "Dubai",
    "USDT",
    "BAF-SAI-2026-001",
  ]) {
    assert.equal(
      serialized.includes(
        forbidden,
      ),
      false,
      `general commercial parameters must not inherit transaction/source-specific term: ${forbidden}`,
    );
  }

  console.log(
    "✓ transaction-specific and source-specific commercial truth excluded",
  );

  assert.throws(
    () =>
      assertFrenchWardCommercialParameters({
        ...projection,

        status:
          FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
            .CURRENT,
      }),

    /CURRENT_REQUIRES_DEFINED_FIELDS/,
  );

  console.log(
    "✓ CURRENT state prohibited until required commercial fields are defined",
  );

  console.log(
    "FRENCH_WARD_COMMERCIAL_PARAMETERS_FOUNDATION_OK",
  );
}

main();
