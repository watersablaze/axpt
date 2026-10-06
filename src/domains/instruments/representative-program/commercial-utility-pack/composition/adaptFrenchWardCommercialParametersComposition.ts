import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS,
  type FrenchWardCommercialParametersProjection,
} from "../../../../institutions/french-ward";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  assertCommercialUtilityPackCompositionDescriptor,
  type CommercialUtilityPackCompositionDescriptor,
} from "./contracts";

import {
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
} from "../contracts";

/**
 * Adapts released French-Ward commercial parameters into CUP identity.
 *
 * Only CURRENT commercial parameters are releaseable to CUP.
 *
 * PREPARING means architecture/content exists but representative guidance
 * has not yet been institutionally released.
 */
export function adaptFrenchWardCommercialParametersComposition(
  projection:
    FrenchWardCommercialParametersProjection,
): CommercialUtilityPackCompositionDescriptor {
  if (
    projection.status !==
      FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
        .CURRENT
  ) {
    throw new Error(
      `[CUP_COMMERCIAL_PARAMETERS_NOT_CURRENT] ${projection.status}`,
    );
  }

  if (
    !projection.reference.trim() ||
    !projection.issuer.trim()
  ) {
    throw new Error(
      "[CUP_COMMERCIAL_PARAMETERS_IDENTITY_REQUIRED]",
    );
  }

  const descriptor:
    CommercialUtilityPackCompositionDescriptor =
    {
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
        projection.reference,

      sourceReference:
        projection.reference,

      label:
        "French-Ward Commercial Parameters",
    };

  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return descriptor;
}
