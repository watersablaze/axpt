import {
  FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS,
  projectFrenchWardCommercialParameters,
  projectFrenchWardInstitutionalProfile,
} from "../../../../institutions/french-ward";

import {
  loadSourceAuthorityPresentationWithClient,
  type SourceAuthorityPresentationLoaderClient,
} from "../../../source-authority/presentation";

import {
  REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS,
  projectRepresentativeOperatingBoundaries,
} from "../../operating-boundaries";

import {
  COMMERCIAL_UTILITY_PACK_MODULE,
  type CommercialUtilityPackModule,
} from "../contracts";

import {
  adaptFrenchWardCommercialParametersComposition,
} from "./adaptFrenchWardCommercialParametersComposition";

import {
  adaptFrenchWardInstitutionalProfileComposition,
} from "./adaptFrenchWardInstitutionalProfileComposition";

import {
  adaptRepresentativeOperatingBoundariesComposition,
} from "./adaptRepresentativeOperatingBoundariesComposition";

import {
  adaptRepresentativeSourceAuthorityComposition,
} from "./adaptRepresentativeSourceAuthorityComposition";

import {
  resolveRepresentativeMasterAgreementCompositionWithClient,
  type RepresentativeMasterAgreementCompositionClient,
} from "./resolveRepresentativeMasterAgreementCompositionWithClient";

import type {
  CommercialUtilityPackCompositionDescriptor,
} from "./contracts";

export const COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY = {
  AVAILABLE:
    "AVAILABLE",

  UNAVAILABLE:
    "UNAVAILABLE",
} as const;

export type CommercialUtilityPackCompositionAvailability =
  (typeof COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY)[keyof typeof COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY];

export const COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON = {
  MASTER_AGREEMENT_ABSENT:
    "MASTER_AGREEMENT_ABSENT",

  SOURCE_AUTHORITY_NOT_SELECTED:
    "SOURCE_AUTHORITY_NOT_SELECTED",

  COMMERCIAL_PARAMETERS_NOT_CURRENT:
    "COMMERCIAL_PARAMETERS_NOT_CURRENT",
} as const;

export type CommercialUtilityPackCompositionUnavailableReason =
  (typeof COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON)[keyof typeof COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON];

export type CommercialUtilityPackCompositionPlanEntry =
  Readonly<{
    module:
      CommercialUtilityPackModule;

    availability:
      CommercialUtilityPackCompositionAvailability;

    descriptor:
      CommercialUtilityPackCompositionDescriptor | null;

    unavailableReason:
      CommercialUtilityPackCompositionUnavailableReason | null;
  }>;

export type CommercialUtilityPackCompositionPlan =
  Readonly<{
    participantId:
      string;

    entries:
      readonly CommercialUtilityPackCompositionPlanEntry[];

    availableDescriptors:
      readonly CommercialUtilityPackCompositionDescriptor[];
  }>;

export type CommercialUtilityPackCompositionPlanClient =
  RepresentativeMasterAgreementCompositionClient &
  SourceAuthorityPresentationLoaderClient;

/**
 * Resolve the representative-safe sources that may participate in CUP.
 *
 * This function is deliberately read-only.
 *
 * It does not:
 * - create a CommercialUtilityPack;
 * - register CommercialUtilityPackResourceRelease records;
 * - transition module state;
 * - release resources;
 * - reconcile package release state;
 * - manufacture unavailable canonical content.
 */
export async function resolveCommercialUtilityPackCompositionPlanWithClient(
  params: Readonly<{
    client:
      CommercialUtilityPackCompositionPlanClient;

    participantId:
      string;

    sourceAuthorityInstrumentReference?:
      string | null;
  }>,
): Promise<
  CommercialUtilityPackCompositionPlan
> {
  const participantId =
    params.participantId.trim();

  if (!participantId) {
    throw new Error(
      "[CUP_COMPOSITION_PLAN_PARTICIPANT_REQUIRED]",
    );
  }

  const entries:
    CommercialUtilityPackCompositionPlanEntry[] =
    [];

  /*
   * REPRESENTATION
   *
   * Canonical institutional profile is representative-safe structured
   * content and presently carries its own canonical identity.
   */
  const institutionalProfile =
    projectFrenchWardInstitutionalProfile();

  entries.push({
    module:
      COMMERCIAL_UTILITY_PACK_MODULE
        .REPRESENTATION,

    availability:
      COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
        .AVAILABLE,

    descriptor:
      adaptFrenchWardInstitutionalProfileComposition(
        institutionalProfile,
      ),

    unavailableReason:
      null,
  });

  /*
   * DOCUMENTS — Master Agreement
   *
   * Absence is a legitimate unavailable state.
   * Contradictory/non-executed state remains an error in the resolver.
   */
  const masterAgreement =
    await resolveRepresentativeMasterAgreementCompositionWithClient({
      client:
        params.client,

      participantId,
    });

  if (masterAgreement) {
    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .AVAILABLE,

      descriptor:
        masterAgreement,

      unavailableReason:
        null,
    });
  } else {
    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .UNAVAILABLE,

      descriptor:
        null,

      unavailableReason:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
          .MASTER_AGREEMENT_ABSENT,
    });
  }

  /*
   * DOCUMENTS — Source Authority
   *
   * Source Authority is not guessed from the representative.
   * An explicit governed instrument reference must be supplied.
   */
  const sourceAuthorityInstrumentReference =
    params.sourceAuthorityInstrumentReference
      ?.trim() ?? "";

  if (sourceAuthorityInstrumentReference) {
    const presentation =
      await loadSourceAuthorityPresentationWithClient({
        client:
          params.client,

        instrumentReference:
          sourceAuthorityInstrumentReference,

        audience:
          "REPRESENTATIVE",
      });

    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .AVAILABLE,

      descriptor:
        adaptRepresentativeSourceAuthorityComposition(
          presentation,
        ),

      unavailableReason:
        null,
    });
  } else {
    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .UNAVAILABLE,

      descriptor:
        null,

      unavailableReason:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
          .SOURCE_AUTHORITY_NOT_SELECTED,
    });
  }

  /*
   * COMMERCIAL PARAMETERS
   *
   * PREPARING is expected to remain unavailable.
   * Do not use an exception as normal orchestration control flow.
   */
  const commercialParameters =
    projectFrenchWardCommercialParameters();

  if (
    commercialParameters.status ===
      FRENCH_WARD_COMMERCIAL_PARAMETERS_STATUS
        .CURRENT
  ) {
    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .COMMERCIAL_PARAMETERS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .AVAILABLE,

      descriptor:
        adaptFrenchWardCommercialParametersComposition(
          commercialParameters,
        ),

      unavailableReason:
        null,
    });
  } else {
    entries.push({
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .COMMERCIAL_PARAMETERS,

      availability:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
          .UNAVAILABLE,

      descriptor:
        null,

      unavailableReason:
        COMMERCIAL_UTILITY_PACK_COMPOSITION_UNAVAILABLE_REASON
          .COMMERCIAL_PARAMETERS_NOT_CURRENT,
    });
  }

  /*
   * OPERATING BOUNDARIES
   *
   * Canonical policy must remain CURRENT.
   * A non-current canonical policy is treated as a contradiction here,
   * because the system currently defines no alternate policy selection.
   */
  const operatingBoundaries =
    projectRepresentativeOperatingBoundaries();

  if (
    operatingBoundaries.status !==
      REPRESENTATIVE_OPERATING_BOUNDARIES_STATUS
        .CURRENT
  ) {
    throw new Error(
      `[CUP_COMPOSITION_PLAN_OPERATING_BOUNDARIES_NOT_CURRENT] ${operatingBoundaries.status}`,
    );
  }

  entries.push({
    module:
      COMMERCIAL_UTILITY_PACK_MODULE
        .OPERATING_BOUNDARIES,

    availability:
      COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
        .AVAILABLE,

    descriptor:
      adaptRepresentativeOperatingBoundariesComposition(
        operatingBoundaries,
      ),

    unavailableReason:
      null,
  });

  const availableDescriptors =
    entries.flatMap(
      (entry) =>
        entry.availability ===
          COMMERCIAL_UTILITY_PACK_COMPOSITION_AVAILABILITY
            .AVAILABLE &&
        entry.descriptor
          ? [entry.descriptor]
          : [],
    );

  return {
    participantId,
    entries,
    availableDescriptors,
  };
}
