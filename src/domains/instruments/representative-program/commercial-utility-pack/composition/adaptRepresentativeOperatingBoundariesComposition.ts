import {
  REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS,
  type RepresentativeOperatingBoundariesProjection,
} from "../../operating-boundaries";

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
 * Adapts the representative-safe Operating Boundaries policy
 * into CUP composition identity.
 *
 * Only CURRENT policy is composable.
 *
 * CUP receives source identity only. It does not evaluate or copy
 * live authority, exercisability, applicability, or authority class.
 */
export function adaptRepresentativeOperatingBoundariesComposition(
  projection:
    RepresentativeOperatingBoundariesProjection,
): CommercialUtilityPackCompositionDescriptor {
  if (
    projection.status !==
      REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
        .CURRENT
  ) {
    throw new Error(
      `[CUP_OPERATING_BOUNDARIES_NOT_CURRENT] ${projection.status}`,
    );
  }

  if (
    !projection.reference.trim() ||
    !projection.title.trim()
  ) {
    throw new Error(
      "[CUP_OPERATING_BOUNDARIES_IDENTITY_REQUIRED]",
    );
  }

  const descriptor:
    CommercialUtilityPackCompositionDescriptor =
    {
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
        projection.reference,

      sourceReference:
        projection.reference,

      label:
        projection.title,
    };

  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return descriptor;
}
