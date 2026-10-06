import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "@/domains/instruments/contracts";

import {
  loadSourceAuthorityPresentationWithClient,
  type SourceAuthorityPresentationProjection,
} from "@/domains/instruments/source-authority";

import {
  loadRepresentativeCommercialUtilityPackWithClient,
} from "./loadRepresentativeCommercialUtilityPackWithClient";

type Client = Pick<
  PrismaClient,
  | "representativeProgramParticipant"
  | "commercialUtilityPack"
  | "institutionalInstrument"
  | "instrumentVersion"
  | "sourceAuthorityRecord"
  | "sourceAuthorityProfileParticulars"
>;

export type RepresentativeCommercialUtilityPackInstitutionalResource =
  | Readonly<{
      kind: "REPRESENTATIVE_PROGRAM_AGREEMENT";
      resourceReleaseId: string;
    }>
  | Readonly<{
      kind: "SOURCE_AUTHORITY";
      packageReference: string;
      resourceReleaseId: string;
      presentation: SourceAuthorityPresentationProjection;
    }>;

export async function loadRepresentativeCommercialUtilityPackInstitutionalResourceWithClient(
  params: {
    client: Client;
    userId: string;
    resourceReleaseId: string;
  },
): Promise<
  RepresentativeCommercialUtilityPackInstitutionalResource | null
> {
  const resourceReleaseId =
    params.resourceReleaseId.trim();

  if (
    !resourceReleaseId ||
    resourceReleaseId.length > 191
  ) {
    return null;
  }

  /*
   * Reuse the canonical representative CUP visibility boundary.
   *
   * Only RELEASED + canView resources are returned by this loader.
   */
  const pack =
    await loadRepresentativeCommercialUtilityPackWithClient({
      client: params.client,
      userId: params.userId,
    });

  if (!pack) {
    return null;
  }

  const matches =
    pack.modules.flatMap(entry =>
      entry.module === "DOCUMENTS"
        ? entry.resources.filter(resource =>
            resource.id === resourceReleaseId &&
            resource.resourceType ===
              "INSTITUTIONAL_INSTRUMENT"
          )
        : [],
    );

  if (matches.length === 0) {
    return null;
  }

  if (matches.length !== 1) {
    throw new Error(
      "[REPRESENTATIVE_CUP_INSTITUTIONAL_RESOURCE_CONTRADICTION]",
    );
  }

  const release =
    matches[0];

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          id: release.resourceId,
        },

        select: {
          id: true,
          reference: true,
          kind: true,
        },
      });

  if (!instrument) {
    return null;
  }

  if (instrument.id !== release.resourceId) {
    throw new Error(
      "[REPRESENTATIVE_CUP_INSTITUTIONAL_RESOURCE_IDENTITY_MISMATCH]",
    );
  }

  if (
    instrument.kind ===
    INSTITUTIONAL_INSTRUMENT_KIND
      .REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    return {
      kind:
        "REPRESENTATIVE_PROGRAM_AGREEMENT",
      resourceReleaseId,
    };
  }

  if (
    instrument.kind ===
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY
  ) {
    const presentation =
      await loadSourceAuthorityPresentationWithClient({
        client: params.client,
        instrumentReference:
          instrument.reference,
        audience:
          "REPRESENTATIVE",
      });

    if (
      presentation.identity.instrumentId !==
        instrument.id ||
      presentation.identity.instrumentReference !==
        instrument.reference
    ) {
      throw new Error(
        "[REPRESENTATIVE_CUP_SOURCE_AUTHORITY_PRESENTATION_IDENTITY_MISMATCH]",
      );
    }

    return {
      kind:
        "SOURCE_AUTHORITY",
      packageReference:
        pack.reference,
      resourceReleaseId,
      presentation,
    };
  }

  /*
   * No generic institutional-instrument fallback.
   *
   * Each governed instrument kind requires an explicit representative
   * presentation contract before it can be exposed here.
   */
  return null;
}
