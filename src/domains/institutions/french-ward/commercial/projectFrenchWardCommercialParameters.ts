import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS,
} from "./canonicalCommercialParameters";

import {
  assertFrenchWardCommercialParameters,
  type FrenchWardCommercialParametersProjection,
} from "./contracts";

/**
 * Representative-safe commercial-parameter projection.
 *
 * The projection preserves unresolved state rather than inventing
 * or inheriting transaction-specific values.
 */
export function projectFrenchWardCommercialParameters():
  FrenchWardCommercialParametersProjection {
  const projection = {
    ...FRENCH_WARD_COMMERCIAL_PARAMETERS,

    commodity: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .commodity,
    },

    transactionStructure: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .transactionStructure,
    },

    quantityFramework: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .quantityFramework,
    },

    pricingFramework: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .pricingFramework,
    },

    deliveryFramework: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .deliveryFramework,
    },

    settlementFramework: {
      ...FRENCH_WARD_COMMERCIAL_PARAMETERS
        .settlementFramework,
    },
  };

  assertFrenchWardCommercialParameters(
    projection,
  );

  return projection;
}
