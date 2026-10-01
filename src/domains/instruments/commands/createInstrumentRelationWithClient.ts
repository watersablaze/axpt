import type { PrismaClient } from "@prisma/client";

import type {
  InstrumentRelationType,
} from "../contracts";
import { INSTRUMENT_EVENT_TYPE } from "../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../stream";

export type InstrumentRelationCreationClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "instrumentRelation" | "domainEvent"
>;

export async function createInstrumentRelationWithClient(params: {
  client: InstrumentRelationCreationClient;
  sourceInstrumentReference: string;
  targetInstrumentReference: string;
  relationType: InstrumentRelationType;
  label?: string | null;
  metadata?: unknown;
  createdByUserId: string;
  occurredAt?: Date;
}) {
  const occurredAt =
    params.occurredAt ?? new Date();
  const label =
    params.label?.trim() || null;

  const [
    sourceInstrument,
    targetInstrument,
  ] = await Promise.all([
    params.client.institutionalInstrument.findUnique({
      where: {
        reference:
          params.sourceInstrumentReference,
      },
      select: {
        id: true,
        reference: true,
      },
    }),
    params.client.institutionalInstrument.findUnique({
      where: {
        reference:
          params.targetInstrumentReference,
      },
      select: {
        id: true,
        reference: true,
      },
    }),
  ]);

  if (!sourceInstrument) {
    throw new Error(
      `[INSTRUMENT_RELATION_SOURCE_NOT_FOUND] ${params.sourceInstrumentReference}`,
    );
  }

  if (!targetInstrument) {
    throw new Error(
      `[INSTRUMENT_RELATION_TARGET_NOT_FOUND] ${params.targetInstrumentReference}`,
    );
  }

  if (
    sourceInstrument.id ===
    targetInstrument.id
  ) {
    throw new Error(
      "[INSTRUMENT_RELATION_SELF_REFERENCE_NOT_ALLOWED]",
    );
  }

  const existing =
    await params.client.instrumentRelation.findUnique({
      where: {
        sourceInstrumentId_targetInstrumentId_relationType: {
          sourceInstrumentId:
            sourceInstrument.id,
          targetInstrumentId:
            targetInstrument.id,
          relationType:
            params.relationType,
        },
      },
      select: {
        id: true,
        sourceInstrumentId: true,
        targetInstrumentId: true,
        relationType: true,
        label: true,
        metadata: true,
        createdByUserId: true,
        createdAt: true,
      },
    });

  if (existing) {
    return {
      relation: existing,
      created: false,
    } as const;
  }

  const relation =
    await params.client.instrumentRelation.create({
      data: {
        sourceInstrumentId:
          sourceInstrument.id,
        targetInstrumentId:
          targetInstrument.id,
        relationType:
          params.relationType,
        label,
        metadata:
          params.metadata === undefined
            ? undefined
            : (params.metadata as object),
        createdByUserId:
          params.createdByUserId,
      },
      select: {
        id: true,
        sourceInstrumentId: true,
        targetInstrumentId: true,
        relationType: true,
        label: true,
        metadata: true,
        createdByUserId: true,
        createdAt: true,
      },
    });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        sourceInstrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .INSTRUMENT_RELATION_CREATED,
      payload: {
        relationId:
          relation.id,
        sourceInstrumentId:
          sourceInstrument.id,
        sourceReference:
          sourceInstrument.reference,
        targetInstrumentId:
          targetInstrument.id,
        targetReference:
          targetInstrument.reference,
        relationType:
          relation.relationType,
        label:
          relation.label,
      },
      metadata: {
        actorUserId:
          params.createdByUserId,
        source:
          "instrument.command.create-relation",
      },
      occurredAt,
    },
  });

  return {
    relation,
    created: true,
  } as const;
}
