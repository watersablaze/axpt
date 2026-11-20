import type {
  PrismaClient,
} from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "../../contracts";

import type {
  CanonicalSourceAuthorityPresentationRecognition,
  CanonicalSourceAuthorityPresentationState,
} from "./deriveSourceAuthorityPresentation";

export type SourceAuthorityPresentationLoaderClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityProfileParticulars"
  >;

type LoadedSourceAuthorityRecognition =
  Readonly<{
    id: string;

    outcome:
      CanonicalSourceAuthorityPresentationRecognition["outcome"];

    limitation:
      string | null;

    reason:
      string | null;

    actorUserId:
      string;

    supersedesRecognitionId:
      string | null;

    currentSlot:
      "CURRENT" | null;

    occurredAt:
      Date;

    evidenceLinks:
      readonly Readonly<{
        evidenceId:
          string;
      }>[];

    supersededBy:
      Readonly<{
        id:
          string;
      }> | null;
  }>;

type LoadedSourceAuthorityCapability =
  Readonly<{
    capabilityKey:
      CanonicalSourceAuthorityPresentationState[
        "assertions"
      ][number][
        "capabilities"
      ][number][
        "capabilityKey"
      ];

    title:
      string;

    description:
      string;
  }>;

type LoadedSourceAuthorityAssertion =
  Readonly<{
    id:
      string;

    versionId:
      string;

    reference:
      string;

    assertionClass:
      CanonicalSourceAuthorityPresentationState[
        "assertions"
      ][number][
        "assertionClass"
      ];

    title:
      string;

    statement:
      string;

    scope:
      string | null;

    ordinal:
      number;

    capabilities:
      readonly LoadedSourceAuthorityCapability[];

    recognitions:
      readonly LoadedSourceAuthorityRecognition[];
  }>;

type LoadedSourceAuthorityEvidenceAdmission =
  Readonly<{
    evidenceRole:
      string;

    evidenceId:
      string | null;

    createdAt:
      Date;

    evidence:
      Readonly<{
        id:
          string;

        instrumentId:
          string;

        title:
          string;

        metadata:
          unknown;
      }> | null;
  }>;

function metadataDocumentReference(
  metadata: unknown,
): string | null {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  const candidate =
    (metadata as Record<string, unknown>)
      .documentReference;

  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed =
    candidate.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function recognitionToCanonical(
  params: Readonly<{
    assertionReference: string;

    recognition: Readonly<{
      id: string;
      outcome:
        CanonicalSourceAuthorityPresentationRecognition["outcome"];
      limitation: string | null;
      reason: string | null;
      actorUserId: string;
      supersedesRecognitionId: string | null;
      occurredAt: Date;

      evidenceLinks:
        readonly Readonly<{
          evidenceId: string;
        }>[];

      supersededBy:
        Readonly<{
          id: string;
        }> | null;
    }>;
  }>,
): CanonicalSourceAuthorityPresentationRecognition {
  return {
    recognitionId:
      params.recognition.id,

    assertionReference:
      params.assertionReference,

    outcome:
      params.recognition.outcome,

    evidenceIds:
      params.recognition.evidenceLinks.map(
        (link) => link.evidenceId,
      ),

    actorUserId:
      params.recognition.actorUserId,

    /*
     * Persistence currently gives us the canonical actor identity,
     * but the audited Source Authority graph does not establish a
     * stable presentation display-name field for that actor.
     *
     * Do not infer one from email or other identity material.
     */
    actorDisplayName:
      null,

    occurredAt:
      params.recognition.occurredAt.toISOString(),

    limitation:
      params.recognition.limitation,

    reason:
      params.recognition.reason,

    supersedesRecognitionId:
      params.recognition.supersedesRecognitionId,

    supersededByRecognitionId:
      params.recognition.supersededBy?.id ??
      null,
  };
}

export async function loadSourceAuthorityCanonicalStateWithClient(
  params: Readonly<{
    client:
      SourceAuthorityPresentationLoaderClient;

    instrumentReference:
      string;

    onReadTiming?: (phase: string, milliseconds: number) => void;
  }>,
): Promise<
  CanonicalSourceAuthorityPresentationState
> {
  const instrumentReference =
    params.instrumentReference.trim();

  if (!instrumentReference) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_REFERENCE_REQUIRED]",
    );
  }

  const instrumentStarted = performance.now();
  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            instrumentReference,
        },

        select: {
          id:
            true,

          reference:
            true,

          kind:
            true,

          title:
            true,

          currentVersion:
            true,
        },
      });

  params.onReadTiming?.("sai_instrument", performance.now() - instrumentStarted);

  if (!instrument) {
    throw new Error(
      `[SOURCE_AUTHORITY_PRESENTATION_NOT_FOUND] ${instrumentReference}`,
    );
  }

  if (
    instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_WRONG_INSTRUMENT_KIND]",
    );
  }

  const versionStarted = performance.now();
  const version =
    await params.client
      .instrumentVersion
      .findUnique({
        where: {
          instrumentId_number: {
            instrumentId:
              instrument.id,

            number:
              instrument.currentVersion,
          },
        },

        select: {
          id:
            true,

          number:
            true,
        },
      });

  params.onReadTiming?.("sai_version", performance.now() - versionStarted);

  if (!version) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_CURRENT_VERSION_NOT_FOUND]",
    );
  }

  const sourceAuthorityStarted = performance.now();
  const sourceAuthority =
    await params.client
      .sourceAuthorityRecord
      .findUnique({
        where: {
          instrumentId:
            instrument.id,
        },

        select: {
          id:
            true,

          instrumentId:
            true,

          subjectDisplayName:
            true,

          jurisdiction:
            true,

          institutionalCapacity:
            true,

          operatingBase:
            true,

          sector:
            true,

          principalCommodityActivity:
            true,

          assertions: {
            where: {
              versionId:
                version.id,
            },

            orderBy: {
              ordinal:
                "asc",
            },

            select: {
              id:
                true,

              versionId:
                true,

              reference:
                true,

              assertionClass:
                true,

              title:
                true,

              statement:
                true,

              scope:
                true,

              ordinal:
                true,

              capabilities: {
                orderBy: {
                  capabilityKey:
                    "asc",
                },

                select: {
                  capabilityKey:
                    true,

                  title:
                    true,

                  description:
                    true,
                },
              },

              recognitions: {
                orderBy: [
                  {
                    occurredAt:
                      "asc",
                  },
                  {
                    id:
                      "asc",
                  },
                ],

                select: {
                  id:
                    true,

                  outcome:
                    true,

                  limitation:
                    true,

                  reason:
                    true,

                  actorUserId:
                    true,

                  supersedesRecognitionId:
                    true,

                  currentSlot:
                    true,

                  occurredAt:
                    true,

                  evidenceLinks: {
                    orderBy: {
                      evidenceId:
                        "asc",
                    },

                    select: {
                      evidenceId:
                        true,
                    },
                  },

                  supersededBy: {
                    select: {
                      id:
                        true,
                    },
                  },
                },
              },
            },
          },

          evidenceAdmissions: {
            orderBy: {
              createdAt:
                "asc",
            },

            select: {
              evidenceRole:
                true,

              evidenceId:
                true,

              createdAt:
                true,

              evidence: {
                select: {
                  id:
                    true,

                  instrumentId:
                    true,

                  title:
                    true,

                  metadata:
                    true,
                },
              },
            },
          },
        },
      });

  params.onReadTiming?.("sai_graph", performance.now() - sourceAuthorityStarted);

  if (!sourceAuthority) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_RECORD_NOT_FOUND]",
    );
  }

  const profileParticularsStarted = performance.now();
  const profileParticulars =
    await params.client
      .sourceAuthorityProfileParticulars
      .findUnique({
        where: {
          sourceAuthorityId_versionId: {
            sourceAuthorityId:
              sourceAuthority.id,

            versionId:
              version.id,
          },
        },

        select: {
          documentReference:
            true,

          documentVersion:
            true,

          documentStatus:
            true,

          registrationReference:
            true,

          registrationStanding:
            true,

          registeredAddress:
            true,

          authorizedRepresentativeName:
            true,

          authorizedRepresentativeCapacity:
            true,

          officialContact:
            true,
        },
      });

  params.onReadTiming?.("sai_particulars", performance.now() - profileParticularsStarted);

  if (!profileParticulars) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_PROFILE_PARTICULARS_NOT_FOUND]",
    );
  }


  if (
    sourceAuthority.instrumentId !==
    instrument.id
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_PRESENTATION_ROOT_INSTRUMENT_MISMATCH]",
    );
  }

  const evidence =
    sourceAuthority.evidenceAdmissions.map(
      (
        admission:
          LoadedSourceAuthorityEvidenceAdmission,
      ) => {
        if (
          !admission.evidenceId ||
          !admission.evidence
        ) {
          throw new Error(
            "[SOURCE_AUTHORITY_PRESENTATION_EVIDENCE_ADMISSION_INCOMPLETE]",
          );
        }

        if (
          admission.evidence.id !==
          admission.evidenceId
        ) {
          throw new Error(
            "[SOURCE_AUTHORITY_PRESENTATION_EVIDENCE_ADMISSION_ID_MISMATCH]",
          );
        }

        if (
          admission.evidence.instrumentId !==
          instrument.id
        ) {
          throw new Error(
            "[SOURCE_AUTHORITY_PRESENTATION_EVIDENCE_INSTRUMENT_MISMATCH]",
          );
        }

        return {
          evidenceId:
            admission.evidence.id,

          evidenceRole:
            admission.evidenceRole,

          label:
            admission.evidence.title,

          reference:
            metadataDocumentReference(
              admission.evidence.metadata,
            ),

          admittedAt:
            admission.createdAt.toISOString(),
        };
      },
    );

  const recognitionHistory:
    CanonicalSourceAuthorityPresentationRecognition[] =
      [];

  const assertions =
    sourceAuthority.assertions.map(
      (
        assertion:
          LoadedSourceAuthorityAssertion,
      ) => {
        if (
          assertion.versionId !==
          version.id
        ) {
          throw new Error(
            "[SOURCE_AUTHORITY_PRESENTATION_ASSERTION_VERSION_MISMATCH]",
          );
        }

        const current =
          assertion.recognitions.filter(
            (recognition) =>
              recognition.currentSlot ===
              "CURRENT",
          );

        if (current.length > 1) {
          throw new Error(
            "[SOURCE_AUTHORITY_PRESENTATION_MULTIPLE_CURRENT_RECOGNITIONS]",
          );
        }

        const canonicalRecognitions =
          assertion.recognitions.map(
            (recognition) =>
              recognitionToCanonical({
                assertionReference:
                  assertion.reference,

                recognition,
              }),
          );

        recognitionHistory.push(
          ...canonicalRecognitions,
        );

        const currentRecognition =
          current.length === 1
            ? recognitionToCanonical({
                assertionReference:
                  assertion.reference,

                recognition:
                  current[0],
              })
            : null;

        return {
          reference:
            assertion.reference,

          assertionClass:
            assertion.assertionClass,

          title:
            assertion.title,

          statement:
            assertion.statement,

          scope:
            assertion.scope,

          /*
           * Assertion-level documentary support follows the
           * CURRENT recognition only.
           *
           * Evidence used by superseded recognitions remains in
           * recognitionHistory and is not silently projected as
           * current support.
           */
          evidenceIds:
            currentRecognition?.evidenceIds ??
            [],

          capabilities:
            assertion.capabilities.map(
              (capability) => ({
                capabilityKey:
                  capability.capabilityKey,

                title:
                  capability.title,

                description:
                  capability.description,

                assertionReference:
                  assertion.reference,
              }),
            ),

          currentRecognition,
        };
      },
    );

  return {
    identity: {
      sourceAuthorityId:
        sourceAuthority.id,

      instrumentId:
        instrument.id,

      instrumentReference:
        instrument.reference,

      instrumentTitle:
        instrument.title,

      versionId:
        version.id,

      versionNumber:
        version.number,

      subject: {
        displayName:
          sourceAuthority
            .subjectDisplayName,

        jurisdiction:
          sourceAuthority
            .jurisdiction,

        institutionalCapacity:
          sourceAuthority
            .institutionalCapacity,

        operatingBase:
          sourceAuthority
            .operatingBase,

        sector:
          sourceAuthority
            .sector,

        principalCommodityActivity:
          [
            ...sourceAuthority
              .principalCommodityActivity,
          ],
      },

      profileParticulars,

    },

    assertions,

    evidence,

    recognitionHistory,
  };
}
