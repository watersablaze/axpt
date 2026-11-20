import type {
  SourceAuthorityPresentationProjection,
} from "../../../source-authority/presentation";

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
 * CUP consumes the governed Source Authority presentation boundary.
 *
 * It does not:
 * - load Source Authority canonical state;
 * - inspect or reinterpret evidence;
 * - derive presentation standing;
 * - evaluate recognition;
 * - create authority;
 * - duplicate Source Authority content.
 *
 * The supplied projection must already have been derived for the
 * REPRESENTATIVE audience by the Source Authority presentation service.
 */
export function adaptRepresentativeSourceAuthorityComposition(
  projection:
    SourceAuthorityPresentationProjection,
): CommercialUtilityPackCompositionDescriptor {
  if (
    projection.audience !==
      "REPRESENTATIVE"
  ) {
    throw new Error(
      `[CUP_SOURCE_AUTHORITY_AUDIENCE_INVALID] ${projection.audience}`,
    );
  }

  const identity =
    projection.identity;

  if (
    !identity.instrumentId.trim() ||
    !identity.instrumentReference.trim() ||
    !identity.instrumentTitle.trim()
  ) {
    throw new Error(
      "[CUP_SOURCE_AUTHORITY_IDENTITY_REQUIRED]",
    );
  }

  const descriptor:
    CommercialUtilityPackCompositionDescriptor =
    {
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

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
        identity.instrumentId,

      sourceReference:
        identity.instrumentReference,

      label:
        identity.instrumentTitle,
    };

  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return descriptor;
}
