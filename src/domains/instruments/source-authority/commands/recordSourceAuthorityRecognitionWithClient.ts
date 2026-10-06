import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "../../contracts";

import { INSTRUMENT_EVENT_TYPE } from "../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../stream";

import {
  SOURCE_AUTHORITY_RECOGNITION_OUTCOME,
  type SourceAuthorityRecognitionOutcome,
} from "../contracts";

type SourceAuthorityEvidenceIdentity = Readonly<{
  id: string;
  instrumentId: string;
}>;

type SourceAuthorityRecognitionEvidenceIdentity =
  Readonly<{
    evidenceId: string;
  }>;

type SourceAuthorityRecognitionSnapshot =
  Readonly<{
    id: string;
    outcome: SourceAuthorityRecognitionOutcome;
    limitation: string | null;
    reason: string | null;
    occurredAt: Date;
    supersedesRecognitionId: string | null;
    currentSlot: "CURRENT" | null;
    supersededBy: Readonly<{
      id: string;
    }> | null;
    evidenceLinks:
      readonly SourceAuthorityRecognitionEvidenceIdentity[];
  }>;

function nullableTrim(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function equalStringSets(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = [...left].sort();
  const b = [...right].sort();

  return JSON.stringify(a) ===
    JSON.stringify(b);
}

function isPrismaUniqueConstraintError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error)
  ) {
    return false;
  }

  return (
    (error as { code?: unknown }).code ===
    "P2002"
  );
}

export type SourceAuthorityRecognitionRecordingClient =
  Pick<
    PrismaClient,
    | "sourceAuthorityAssertion"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "instrumentEvidence"
    | "domainEvent"
  >;

export async function recordSourceAuthorityRecognitionWithClient(
  params: {
    client:
      SourceAuthorityRecognitionRecordingClient;
    assertionId: string;
    outcome:
      SourceAuthorityRecognitionOutcome;
    evidenceIds: readonly string[];
    actorUserId: string;
    limitation?: string | null;
    reason?: string | null;
    supersedesRecognitionId?: string | null;
    occurredAt?: Date;
  },
) {
  const evidenceIds =
    [...new Set(params.evidenceIds)];

  if (
    evidenceIds.length !==
    params.evidenceIds.length
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_DUPLICATE_EVIDENCE]",
    );
  }

  const limitation =
    nullableTrim(params.limitation);

  const reason =
    nullableTrim(params.reason);

  const affirmative =
    params.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .RECOGNIZED ||
    params.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .RECOGNIZED_WITH_LIMITATION;

  if (
    affirmative &&
    evidenceIds.length === 0
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_REQUIRED]",
    );
  }

  if (
    params.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .RECOGNIZED_WITH_LIMITATION &&
    !limitation
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_LIMITATION_REQUIRED]",
    );
  }

  if (
    params.outcome ===
      SOURCE_AUTHORITY_RECOGNITION_OUTCOME
        .NOT_RECOGNIZED &&
    !reason
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_NON_RECOGNITION_REASON_REQUIRED]",
    );
  }

  const assertion =
    await params.client
      .sourceAuthorityAssertion
      .findUnique({
        where: {
          id:
            params.assertionId,
        },
        include: {
          sourceAuthority: {
            include: {
              instrument: true,
            },
          },
          recognitions: {
            include: {
              evidenceLinks: true,
              supersededBy: true,
            },
            orderBy: {
              occurredAt: "desc",
            },
          },
        },
      });

  if (!assertion) {
    throw new Error(
      `[SOURCE_AUTHORITY_RECOGNITION_ASSERTION_NOT_FOUND] ${params.assertionId}`,
    );
  }

  const instrument =
    assertion.sourceAuthority.instrument;

  if (
    instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_WRONG_INSTRUMENT_KIND]",
    );
  }

  /*
   * Every supporting evidence object must belong to the
   * same canonical InstitutionalInstrument as the SAI.
   */
  const evidence:
    readonly SourceAuthorityEvidenceIdentity[] =
      evidenceIds.length === 0
        ? []
        : await params.client
            .instrumentEvidence
            .findMany({
              where: {
                id: {
                  in: evidenceIds,
                },
              },
              select: {
                id: true,
                instrumentId: true,
              },
            });

  if (
    evidence.length !==
    evidenceIds.length
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_NOT_FOUND]",
    );
  }

  const mismatched =
    evidence.find(
      (item) =>
        item.instrumentId !==
        instrument.id,
    );

  if (mismatched) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_EVIDENCE_INSTRUMENT_MISMATCH]",
    );
  }

  const recognitions =
    assertion.recognitions as
      readonly SourceAuthorityRecognitionSnapshot[];

  const active =
    recognitions.find(
      (candidate) =>
        candidate.currentSlot ===
          "CURRENT",
    );

  const supersedesId =
    params.supersedesRecognitionId ??
    null;

  if (!supersedesId && active) {
    const activeEvidenceIds =
      active.evidenceLinks.map(
        (link) => link.evidenceId,
      );

    const same =
      active.outcome ===
        params.outcome &&
      active.limitation ===
        limitation &&
      active.reason ===
        reason &&
      equalStringSets(
        activeEvidenceIds,
        evidenceIds,
      );

    if (same) {
      return {
        recognition: active,
        created: false,
        supersededRecognitionId:
          null,
      } as const;
    }

    throw new Error(
      `[SOURCE_AUTHORITY_RECOGNITION_ACTIVE_EXISTS_REQUIRES_SUPERSESSION] ${active.id}`,
    );
  }

  let superseded:
    | SourceAuthorityRecognitionSnapshot
    | null = null;

  if (supersedesId) {
    superseded =
      recognitions.find(
        (candidate) =>
          candidate.id ===
          supersedesId,
      ) ?? null;

    if (!superseded) {
      throw new Error(
        "[SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_SOURCE_NOT_FOUND]",
      );
    }

    if (
      superseded.currentSlot !==
        "CURRENT" ||
      superseded.supersededBy !== null
    ) {
      throw new Error(
        "[SOURCE_AUTHORITY_RECOGNITION_ALREADY_SUPERSEDED]",
      );
    }

    if (
      active &&
      active.id !== superseded.id
    ) {
      throw new Error(
        "[SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_NOT_ACTIVE]",
      );
    }
  }

  const occurredAt =
    params.occurredAt ?? new Date();

  if (
    superseded &&
    occurredAt.getTime() <
      superseded.occurredAt.getTime()
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_PRECEDES_SOURCE]",
    );
  }

  /*
   * Supersession is a compare-and-set operation.
   *
   * Only the recognition still occupying the assertion's
   * CURRENT slot may be retired. Concurrent writers cannot
   * both retire the same predecessor.
   */
  if (superseded) {
    const retired =
      await params.client
        .sourceAuthorityRecognition
        .updateMany({
          where: {
            id:
              superseded.id,
            assertionId:
              assertion.id,
            currentSlot:
              "CURRENT",
          },
          data: {
            currentSlot:
              null,
          },
        });

    if (retired.count !== 1) {
      throw new Error(
        "[SOURCE_AUTHORITY_RECOGNITION_SUPERSESSION_CONCURRENCY_CONFLICT]",
      );
    }
  }

  let recognition;

  try {
    recognition =
      await params.client
        .sourceAuthorityRecognition
        .create({
          data: {
            assertionId:
              assertion.id,
            outcome:
              params.outcome,
            limitation,
            reason,
            actorUserId:
              params.actorUserId,
            supersedesRecognitionId:
              superseded?.id ?? null,
            currentSlot:
              "CURRENT",
            occurredAt,
          },
        });
  } catch (error) {
    if (
      isPrismaUniqueConstraintError(
        error,
      )
    ) {
      throw new Error(
        "[SOURCE_AUTHORITY_RECOGNITION_CURRENT_SLOT_CONFLICT]",
      );
    }

    throw error;
  }

  if (evidenceIds.length > 0) {
    await params.client
      .sourceAuthorityRecognitionEvidence
      .createMany({
        data:
          evidenceIds.map(
            (evidenceId) => ({
              recognitionId:
                recognition.id,
              evidenceId,
            }),
          ),
      });
  }

  const events = [];

  if (superseded) {
    events.push({
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .SOURCE_AUTHORITY_RECOGNITION_SUPERSEDED,
      payload: {
        assertionId:
          assertion.id,
        supersededRecognitionId:
          superseded.id,
        replacementRecognitionId:
          recognition.id,
      },
      metadata: {
        actorUserId:
          params.actorUserId,
        source:
          "source-authority.command.record-recognition",
      },
      occurredAt,
    });
  }

  events.push({
    streamType:
      INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
    streamId:
      instrument.id,
    eventType:
      INSTRUMENT_EVENT_TYPE
        .SOURCE_AUTHORITY_RECOGNITION_RECORDED,
    payload: {
      recognitionId:
        recognition.id,
      assertionId:
        assertion.id,
      outcome:
        recognition.outcome,
      evidenceIds,
      limitation:
        recognition.limitation,
      reason:
        recognition.reason,
      supersedesRecognitionId:
        recognition
          .supersedesRecognitionId,
    },
    metadata: {
      actorUserId:
        params.actorUserId,
      source:
        "source-authority.command.record-recognition",
    },
    occurredAt,
  });

  await params.client.domainEvent.createMany({
    data: events,
  });

  return {
    recognition,
    created: true,
    supersededRecognitionId:
      superseded?.id ?? null,
  } as const;
}
