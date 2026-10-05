import type {
  FrenchWardInstitutionalProfileProjection,
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
 * Adapts the representative-safe French-Ward institutional profile
 * projection into CUP composition identity.
 *
 * CUP does not own or duplicate the profile content.
 */
export function adaptFrenchWardInstitutionalProfileComposition(
  projection:
    FrenchWardInstitutionalProfileProjection,
): CommercialUtilityPackCompositionDescriptor {
  if (
    !projection.reference.trim() ||
    !projection.displayName.trim()
  ) {
    throw new Error(
      "[CUP_FRENCH_WARD_PROFILE_IDENTITY_REQUIRED]",
    );
  }

  const descriptor:
    CommercialUtilityPackCompositionDescriptor =
    {
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .REPRESENTATION,

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
        projection.reference,

      sourceReference:
        projection.reference,

      label:
        `${projection.displayName} Institutional Profile`,
    };

  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return descriptor;
}
