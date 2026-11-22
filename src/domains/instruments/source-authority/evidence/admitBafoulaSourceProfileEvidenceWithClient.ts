import {
  createHash,
} from "node:crypto";

import type {
  PrismaClient,
} from "@prisma/client";

import {
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "../../contracts";

import {
  recordInstrumentEvidenceWithClient,
} from "../../commands/recordInstrumentEvidenceWithClient";

import {
  BAFOULA_SOURCE_PROFILE_EVIDENCE,
} from "./bafoulaEvidenceAdmissionMatrix";

import {
  BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE,
} from "./bafoulaEvidenceRoles";

export type BafoulaProfileEvidenceAdmissionClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "sourceAuthorityRecord"
    | "sourceAuthorityEvidenceAdmission"
    | "instrumentEvidence"
    | "domainEvent"
  >;

function bafoulaProfileAdmissionKey(
  uri: string,
  contentHash: string,
): string {
  const canonical =
    [
      "BAFOULA_SOURCE_PROFILE_EVIDENCE",
      BAFOULA_SOURCE_PROFILE_EVIDENCE
        .documentReference,
      BAFOULA_SOURCE_PROFILE_EVIDENCE
        .version,
      uri,
      contentHash,
    ].join("\n");

  const digest =
    createHash("sha256")
      .update(
        canonical,
        "utf8",
      )
      .digest("hex");

  return [
    "source-authority",
    "bafoula-profile",
    digest,
  ].join(":");
}

export async function admitBafoulaSourceProfileEvidenceWithClient(
  params: Readonly<{
    client:
      BafoulaProfileEvidenceAdmissionClient;

    actorUserId:
      string;

    uri:
      string;

    contentHash:
      string;

    recordedAt?:
      Date;
  }>,
) {
  const uri =
    params.uri.trim();

  const contentHash =
    params.contentHash.trim();

  if (!uri) {
    throw new Error(
      "[BAFOULA_SOURCE_PROFILE_EVIDENCE_URI_REQUIRED]",
    );
  }

  if (!contentHash) {
    throw new Error(
      "[BAFOULA_SOURCE_PROFILE_EVIDENCE_HASH_REQUIRED]",
    );
  }

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            "BAF-SAI-2026-001",
        },

        select: {
          id:
            true,
        },
      });

  if (!instrument) {
    throw new Error(
      "[BAFOULA_SOURCE_AUTHORITY_INSTRUMENT_NOT_FOUND]",
    );
  }

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
        },
      });

  if (!sourceAuthority) {
    throw new Error(
      "[BAFOULA_SOURCE_AUTHORITY_RECORD_NOT_FOUND]",
    );
  }

  const admissionKey =
    bafoulaProfileAdmissionKey(
      uri,
      contentHash,
    );

  /*
   * Claim-first concurrency doctrine:
   *
   * The Source Authority aggregate owns a unique admission
   * slot. InstrumentEvidence itself remains append-oriented.
   *
   * PostgreSQL ON CONFLICT semantics, exposed by Prisma's
   * createMany({ skipDuplicates: true }), ensure that two
   * concurrent first writers cannot both own this slot.
   *
   * This function is a low-level WithClient operation.
   * Its caller owns the transaction boundary so claim,
   * evidence, event, and claim binding commit atomically.
   */
  const claimed =
    await params.client
      .sourceAuthorityEvidenceAdmission
      .createMany({
        data: [
          {
            sourceAuthorityId:
              sourceAuthority.id,

            evidenceRole:
              BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE,

            admissionKey,
          },
        ],

        skipDuplicates:
          true,
      });

  if (claimed.count === 0) {
    /*
     * A prior or concurrent writer owns the admission.
     *
     * Under PostgreSQL READ COMMITTED semantics, a concurrent
     * INSERT ... ON CONFLICT waits for the winning transaction
     * and the subsequent statement can resolve its committed
     * claim.
     */
    const existingClaim =
      await params.client
        .sourceAuthorityEvidenceAdmission
        .findUnique({
          where: {
            sourceAuthorityId_evidenceRole: {
              sourceAuthorityId:
                sourceAuthority.id,

              evidenceRole:
                BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE,
            },
          },

          select: {
            admissionKey:
              true,

            evidenceId:
              true,
          },
        });

    if (!existingClaim) {
      throw new Error(
        "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_CLAIM_NOT_RESOLVED]",
      );
    }

    if (
      existingClaim.admissionKey !==
      admissionKey
    ) {
      throw new Error(
        "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE_COLLISION]",
      );
    }

    if (!existingClaim.evidenceId) {
      throw new Error(
        "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_INCOMPLETE]",
      );
    }

    const existingEvidence =
      await params.client
        .instrumentEvidence
        .findUnique({
          where: {
            id:
              existingClaim.evidenceId,
          },
        });

    if (!existingEvidence) {
      throw new Error(
        "[BAFOULA_SOURCE_PROFILE_EVIDENCE_CLAIM_EVIDENCE_MISSING]",
      );
    }

    if (
      existingEvidence.instrumentId !==
        instrument.id ||
      existingEvidence.evidenceType !==
        INSTRUMENT_EVIDENCE_TYPE.DOCUMENT ||
      existingEvidence.subjectType !==
        INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT ||
      existingEvidence.subjectId !==
        instrument.id ||
      existingEvidence.uri !==
        uri ||
      existingEvidence.contentHash !==
        contentHash
    ) {
      throw new Error(
        "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_COLLISION]",
      );
    }

    return {
      evidence:
        existingEvidence,

      created:
        false,
    } as const;
  }

  if (claimed.count !== 1) {
    throw new Error(
      "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_CLAIM_CARDINALITY_INVALID]",
    );
  }

  const recorded =
    await recordInstrumentEvidenceWithClient({
      client:
        params.client,

      instrumentReference:
        "BAF-SAI-2026-001",

      evidenceType:
        INSTRUMENT_EVIDENCE_TYPE
          .DOCUMENT,

      subjectType:
        INSTRUMENT_EVIDENCE_SUBJECT
          .INSTRUMENT,

      subjectId:
        instrument.id,

      title:
        BAFOULA_SOURCE_PROFILE_EVIDENCE
          .title,

      uri,

      contentHash,

      metadata: {
        documentReference:
          BAFOULA_SOURCE_PROFILE_EVIDENCE
            .documentReference,

        documentVersion:
          BAFOULA_SOURCE_PROFILE_EVIDENCE
            .version,

        documentStatus:
          BAFOULA_SOURCE_PROFILE_EVIDENCE
            .status,

        candidateAssertionReferences:
          BAFOULA_SOURCE_PROFILE_EVIDENCE
            .assertionAdmission
            .filter(
              (item) =>
                item.admissible,
            )
            .map(
              (item) =>
                item.assertionReference,
            ),

        recognitionImplied:
          false,

        transactionAuthorityConferred:
          false,

        sovereignAuthorityConferred:
          false,
      },

      recordedByUserId:
        params.actorUserId,

      recordedAt:
        params.recordedAt,
    });

  const bound =
    await params.client
      .sourceAuthorityEvidenceAdmission
      .updateMany({
        where: {
          sourceAuthorityId:
            sourceAuthority.id,

          evidenceRole:
            BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE,

          admissionKey,

          evidenceId:
            null,
        },

        data: {
          evidenceId:
            recorded.evidence.id,
        },
      });

  if (bound.count !== 1) {
    throw new Error(
      "[BAFOULA_SOURCE_PROFILE_EVIDENCE_ADMISSION_BIND_CONCURRENCY_CONFLICT]",
    );
  }

  return {
    evidence:
      recorded.evidence,

    created:
      true,
  } as const;
}
