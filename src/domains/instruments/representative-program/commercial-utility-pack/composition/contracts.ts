import {
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  type CommercialUtilityPackModule,
  type CommercialUtilityPackResourceType,
} from "../contracts";

/**
 * CUP composition never owns canonical truth.
 *
 * A composition descriptor identifies a canonical or governed
 * source that may be projected into a representative-specific CUP.
 *
 * Release state and representative-facing permissions remain
 * governed by CommercialUtilityPackResourceRelease.
 */
export const COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND = {
  INSTITUTIONAL_INSTRUMENT:
    "INSTITUTIONAL_INSTRUMENT",

  GOVERNED_DOCUMENT:
    "GOVERNED_DOCUMENT",

  STRUCTURED_PROJECTION:
    "STRUCTURED_PROJECTION",
} as const;

export type CommercialUtilityPackCanonicalSourceKind =
  (typeof COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND)[keyof typeof COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND];

export const COMMERCIAL_UTILITY_PACK_PROJECTION_KEY = {
  REPRESENTATIVE_MASTER_AGREEMENT:
    "REPRESENTATIVE_MASTER_AGREEMENT",

  SOURCE_AUTHORITY_PRESENTATION:
    "SOURCE_AUTHORITY_PRESENTATION",

  FRENCH_WARD_INSTITUTIONAL_PROFILE:
    "FRENCH_WARD_INSTITUTIONAL_PROFILE",

  COMMERCIAL_PARAMETERS:
    "COMMERCIAL_PARAMETERS",

  OPERATING_BOUNDARIES:
    "OPERATING_BOUNDARIES",
} as const;

export type CommercialUtilityPackProjectionKey =
  (typeof COMMERCIAL_UTILITY_PACK_PROJECTION_KEY)[keyof typeof COMMERCIAL_UTILITY_PACK_PROJECTION_KEY];

export type CommercialUtilityPackCompositionDescriptor =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    resourceType:
      CommercialUtilityPackResourceType;

    sourceKind:
      CommercialUtilityPackCanonicalSourceKind;

    projectionKey:
      CommercialUtilityPackProjectionKey;

    /**
     * Stable canonical identity.
     *
     * Examples:
     * - InstitutionalInstrument.id
     * - governed document reference
     * - canonical structured projection identifier
     *
     * This is a pointer, not duplicated source content.
     */
    sourceId:
      string;

    label:
      string;

    /**
     * Human-safe source reference when one exists.
     *
     * Example:
     * FWI-26-RP-ONB-CFCC47E131-MA
     * BAF-SAI-2026-001
     */
    sourceReference:
      string | null;
  }>;

export function assertCommercialUtilityPackCompositionDescriptor(
  descriptor:
    CommercialUtilityPackCompositionDescriptor,
): void {
  if (
    !descriptor.sourceId.trim() ||
    !descriptor.label.trim()
  ) {
    throw new Error(
      "[CUP_COMPOSITION_SOURCE_IDENTITY_REQUIRED]",
    );
  }

  switch (descriptor.projectionKey) {
    case COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .REPRESENTATIVE_MASTER_AGREEMENT: {
      if (
        descriptor.module !==
          COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS ||
        descriptor.resourceType !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .INSTITUTIONAL_INSTRUMENT ||
        descriptor.sourceKind !==
          COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
            .INSTITUTIONAL_INSTRUMENT
      ) {
        throw new Error(
          "[CUP_COMPOSITION_MASTER_AGREEMENT_SHAPE_INVALID]",
        );
      }

      return;
    }

    case COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .SOURCE_AUTHORITY_PRESENTATION: {
      if (
        descriptor.module !==
          COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS ||
        descriptor.resourceType !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .INSTITUTIONAL_INSTRUMENT ||
        descriptor.sourceKind !==
          COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
            .INSTITUTIONAL_INSTRUMENT
      ) {
        throw new Error(
          "[CUP_COMPOSITION_SOURCE_AUTHORITY_SHAPE_INVALID]",
        );
      }

      return;
    }

    case COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .FRENCH_WARD_INSTITUTIONAL_PROFILE: {
      if (
        descriptor.module !==
          COMMERCIAL_UTILITY_PACK_MODULE.REPRESENTATION ||
        descriptor.resourceType !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .STRUCTURED_CONTENT ||
        descriptor.sourceKind !==
          COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
            .STRUCTURED_PROJECTION
      ) {
        throw new Error(
          "[CUP_COMPOSITION_INSTITUTIONAL_PROFILE_SHAPE_INVALID]",
        );
      }

      return;
    }

    case COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .COMMERCIAL_PARAMETERS: {
      if (
        descriptor.module !==
          COMMERCIAL_UTILITY_PACK_MODULE
            .COMMERCIAL_PARAMETERS ||
        descriptor.resourceType !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .STRUCTURED_CONTENT ||
        descriptor.sourceKind !==
          COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
            .STRUCTURED_PROJECTION
      ) {
        throw new Error(
          "[CUP_COMPOSITION_COMMERCIAL_PARAMETERS_SHAPE_INVALID]",
        );
      }

      return;
    }

    case COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .OPERATING_BOUNDARIES: {
      if (
        descriptor.module !==
          COMMERCIAL_UTILITY_PACK_MODULE
            .OPERATING_BOUNDARIES ||
        descriptor.resourceType !==
          COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
            .STRUCTURED_CONTENT ||
        descriptor.sourceKind !==
          COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
            .STRUCTURED_PROJECTION
      ) {
        throw new Error(
          "[CUP_COMPOSITION_OPERATING_BOUNDARIES_SHAPE_INVALID]",
        );
      }

      return;
    }

    default: {
      const exhaustive:
        never =
        descriptor.projectionKey;

      throw new Error(
        `[CUP_COMPOSITION_PROJECTION_UNSUPPORTED] ${exhaustive}`,
      );
    }
  }
}

/**
 * Persistence bridge.
 *
 * CUP resource persistence needs only:
 * resourceType + resourceId.
 *
 * The descriptor remains the canonical composition explanation;
 * CommercialUtilityPackResourceRelease remains the release record.
 */
export function toCommercialUtilityPackResourceIdentity(
  descriptor:
    CommercialUtilityPackCompositionDescriptor,
): Readonly<{
  resourceType:
    CommercialUtilityPackResourceType;
  resourceId:
    string;
}> {
  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return {
    resourceType:
      descriptor.resourceType,
    resourceId:
      descriptor.sourceId,
  };
}
