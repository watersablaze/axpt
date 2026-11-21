import type {
  PrismaClient,
} from "@prisma/client";

import {
  recordSourceAuthorityRecognitionWithClient,
} from "../commands/recordSourceAuthorityRecognitionWithClient";

import {
  BAFOULA_SOURCE_PROFILE_EVIDENCE_ROLE,
} from "../evidence/bafoulaEvidenceRoles";

import {
  BAFOULA_RECOGNITION_PLAN,
} from "./bafoulaRecognitionPlan";

export const BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS = [
  "A001",
  "A003",
  "A005",
] as const;

export type BafoulaProfileRecognitionAuthorizedAssertion =
  (typeof BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS)[number];

type BafoulaAssertionIdentity =
  Readonly<{
    id: string;
    reference: string;
  }>;

export type BafoulaProfileRecognitionExecutionClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "sourceAuthorityRecord"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "sourceAuthorityEvidenceAdmission"
    | "instrumentEvidence"
    | "domainEvent"
  >;

function isAuthorizedAssertion(
  value: string,
): value is BafoulaProfileRecognitionAuthorizedAssertion {
  return (
    BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS as
      readonly string[]
  ).includes(value);
}

export async function executeBafoulaProfileRecognitionWithClient(
  params: Readonly<{
    client:
      BafoulaProfileRecognitionExecutionClient;

    actorUserId:
      string;

    occurredAt?:
      Date;
  }>,
) {
  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            BAFOULA_RECOGNITION_PLAN
              .instrumentReference,
        },

        select: {
          id:
            true,
        },
      });

  if (!instrument) {
    throw new Error(
      "[BAFOULA_RECOGNITION_INSTRUMENT_NOT_FOUND]",
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
      "[BAFOULA_RECOGNITION_SOURCE_AUTHORITY_NOT_FOUND]",
    );
  }

  /*
   * Recognition must use the already-admitted canonical
   * Bafoula profile evidence. Admission and recognition are
   * deliberately separate operations.
   */
  const admission =
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
          evidenceId:
            true,
        },
      });

  if (!admission) {
    throw new Error(
      "[BAFOULA_RECOGNITION_CANONICAL_PROFILE_ADMISSION_NOT_FOUND]",
    );
  }

  if (!admission.evidenceId) {
    throw new Error(
      "[BAFOULA_RECOGNITION_CANONICAL_PROFILE_ADMISSION_INCOMPLETE]",
    );
  }

  const evidenceId =
    admission.evidenceId;

  const evidence =
    await params.client
      .instrumentEvidence
      .findUnique({
        where: {
          id:
            evidenceId,
        },

        select: {
          id:
            true,

          instrumentId:
            true,

          evidenceType:
            true,

          subjectType:
            true,

          subjectId:
            true,

          title:
            true,

          metadata:
            true,
        },
      });

  if (!evidence) {
    throw new Error(
      "[BAFOULA_RECOGNITION_PROFILE_EVIDENCE_NOT_FOUND]",
    );
  }

  if (
    evidence.instrumentId !==
      instrument.id ||
    evidence.evidenceType !==
      "DOCUMENT" ||
    evidence.subjectType !==
      "INSTRUMENT" ||
    evidence.subjectId !==
      instrument.id
  ) {
    throw new Error(
      "[BAFOULA_RECOGNITION_PROFILE_EVIDENCE_INVALID]",
    );
  }

  const assertions =
    await params.client
      .sourceAuthorityAssertion
      .findMany({
        where: {
          sourceAuthorityId:
            sourceAuthority.id,
        },

        select: {
          id:
            true,

          reference:
            true,
        },
      });

  const assertionByReference =
    new Map<
      string,
      BafoulaAssertionIdentity
    >(
      (
        assertions as
          readonly BafoulaAssertionIdentity[]
      ).map(
        (assertion) => [
          assertion.reference,
          assertion,
        ] as const,
      ),
    );

  const results = [];

  for (
    const item
    of BAFOULA_RECOGNITION_PLAN.items
  ) {
    if (
      !isAuthorizedAssertion(
        item.assertionReference,
      )
    ) {
      continue;
    }

    if (
      item.disposition !==
        "CANDIDATE_RECOGNITION" ||
      item.outcome !==
        "RECOGNIZED_WITH_LIMITATION" ||
      item.operatorDecisionRequired !==
        true
    ) {
      throw new Error(
        `[BAFOULA_RECOGNITION_AUTHORIZED_ASSERTION_POLICY_MISMATCH] ${item.assertionReference}`,
      );
    }

    const assertion =
      assertionByReference.get(
        item.assertionReference,
      );

    if (!assertion) {
      throw new Error(
        `[BAFOULA_RECOGNITION_ASSERTION_NOT_FOUND] ${item.assertionReference}`,
      );
    }

    const result =
      await recordSourceAuthorityRecognitionWithClient({
        client:
          params.client,

        assertionId:
          assertion.id,

        outcome:
          item.outcome,

        evidenceIds: [
          evidence.id,
        ],

        actorUserId:
          params.actorUserId,

        limitation:
          item.limitation,

        reason:
          null,

        occurredAt:
          params.occurredAt,
      });

    results.push({
      assertionReference:
        item.assertionReference,

      ...result,
    });
  }

  if (
    results.length !==
    BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS.length
  ) {
    throw new Error(
      "[BAFOULA_RECOGNITION_AUTHORIZED_SCOPE_CARDINALITY_INVALID]",
    );
  }

  return {
    instrumentId:
      instrument.id,

    evidenceId:
      evidence.id,

    results,

    recognizedAssertionReferences:
      BAFOULA_PROFILE_RECOGNITION_AUTHORIZED_ASSERTIONS,
  } as const;
}
