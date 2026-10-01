import type { PrismaClient } from "@prisma/client";

import type {
  InstrumentEvidenceSubject,
  InstrumentEvidenceType,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentEvidenceRecordingClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "instrumentEvidence" | "domainEvent"
>;

export async function recordInstrumentEvidenceWithClient(params: {
  client: InstrumentEvidenceRecordingClient;
  instrumentReference: string;
  evidenceType: InstrumentEvidenceType;
  subjectType: InstrumentEvidenceSubject;
  subjectId?: string | null;
  title: string;
  uri?: string | null;
  contentHash?: string | null;
  metadata?: unknown;
  recordedByUserId: string;
  recordedAt?: Date;
}) {
  const title = params.title.trim();
  const uri = params.uri?.trim() || null;
  const contentHash =
    params.contentHash?.trim() || null;
  const subjectId =
    params.subjectId?.trim() || null;
  const recordedAt =
    params.recordedAt ?? new Date();

  if (!title) {
    throw new Error(
      "[INSTRUMENT_EVIDENCE_TITLE_REQUIRED]",
    );
  }

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference: params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_EVIDENCE_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  /*
   * Evidence is append-oriented.
   *
   * A content hash may identify the same binary/object across
   * several evidentiary contexts, so it is intentionally not
   * globally unique.
   */
  const evidence =
    await params.client.instrumentEvidence.create({
      data: {
        instrumentId: instrument.id,
        evidenceType: params.evidenceType,
        subjectType: params.subjectType,
        subjectId,
        title,
        uri,
        contentHash,
        metadata:
          params.metadata === undefined
            ? undefined
            : (params.metadata as object),
        recordedByUserId:
          params.recordedByUserId,
        recordedAt,
      },
      select: {
        id: true,
        instrumentId: true,
        evidenceType: true,
        subjectType: true,
        subjectId: true,
        title: true,
        uri: true,
        contentHash: true,
        metadata: true,
        recordedByUserId: true,
        recordedAt: true,
        createdAt: true,
      },
    });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId: instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_EVIDENCE_RECORDED,
      payload: {
        evidenceId: evidence.id,
        evidenceType:
          evidence.evidenceType,
        subjectType:
          evidence.subjectType,
        subjectId:
          evidence.subjectId,
        title:
          evidence.title,
        uri:
          evidence.uri,
        contentHash:
          evidence.contentHash,
        recordedAt:
          evidence.recordedAt.toISOString(),
      },
      metadata: {
        actorUserId:
          params.recordedByUserId,
        source:
          "instrument.command.record-evidence",
      },
      occurredAt: recordedAt,
    },
  });

  return {
    evidence,
    recorded: true,
  } as const;
}
