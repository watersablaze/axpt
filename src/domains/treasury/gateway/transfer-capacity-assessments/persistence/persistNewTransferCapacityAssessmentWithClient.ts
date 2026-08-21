import type { TransactionClient } from "@prisma/client";

import { TREASURY_AGGREGATE_TYPE } from "../../events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../events/eventType";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TransferCapacityAssessment } from "../contracts";

import type { TransferCapacityAssessmentRecordedPayload } from "../events";

import type { PersistedNewTransferCapacityAssessment } from "./contracts";

type PrismaKnownRequestError = Readonly<{
  code: string;

  meta?: Readonly<{
    target?: unknown;
  }>;
}>;

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function isPrismaKnownRequestError(
  error: unknown,
): error is PrismaKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function getUniqueTarget(error: PrismaKnownRequestError): readonly string[] {
  const target = error.meta?.target;

  return Array.isArray(target)
    ? target.filter((value): value is string => typeof value === "string")
    : [];
}

function capacityPosture(aggregate: TransferCapacityAssessment): string {
  return aggregate.executableNow === undefined ? "UNDETERMINED" : "DETERMINATE";
}

export async function persistNewTransferCapacityAssessmentWithClient(params: {
  result: TreasuryDomainResult<
    TransferCapacityAssessment,
    TransferCapacityAssessmentRecordedPayload
  >;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<PersistedNewTransferCapacityAssessment> {
  const { result, eventId, context, client } = params;

  const { aggregate, event } = result;

  if (aggregate.metadata.version !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_AGGREGATE_VERSION_INVALID] expected 1, received ${aggregate.metadata.version}`,
    );
  }

  if (
    event.eventType !==
    TREASURY_EVENT_TYPE.TRANSFER_CAPACITY_ASSESSMENT_RECORDED
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_NEW_TRANSFER_CAPACITY_ASSESSMENT_EVENT_INVALID] ${event.eventType}`,
    );
  }

  if (event.payload.assessmentId !== aggregate.id) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVENT_TARGET_MISMATCH] ${event.payload.assessmentId} -> ${aggregate.id}`,
    );
  }

  if (event.payload.transferId !== aggregate.transferId) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_EVENT_TRANSFER_MISMATCH] ${event.payload.transferId} -> ${aggregate.transferId}`,
    );
  }

  try {
    await client.treasuryGatewayAggregate.create({
      data: {
        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: aggregate.id,

        version: aggregate.metadata.version,

        /*
         * Capacity Assessments are immutable findings.
         *
         * Their indexed posture represents whether Treasury
         * established a determinate executable amount.
         */
        status: capacityPosture(aggregate),

        snapshot: toJsonValue(aggregate),
      },
    });

    const persistedEvent = await client.treasuryGatewayEvent.create({
      data: {
        eventId,

        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: aggregate.id,

        aggregateVersion: aggregate.metadata.version,

        eventType: event.eventType,

        actorId: context.actorId,

        authorityGrantId: context.authorityGrantId,

        correlationId: context.correlationId,

        causationId: context.causationId,

        payload: toJsonValue(event.payload),

        occurredAt: event.occurredAt,
      },
    });

    return {
      aggregate,

      event: {
        eventId,

        sequence: persistedEvent.sequence,

        aggregateType: TREASURY_AGGREGATE_TYPE.TRANSFER_CAPACITY_ASSESSMENT,

        aggregateId: aggregate.id,

        aggregateVersion: aggregate.metadata.version,

        eventType: event.eventType,

        actorId: context.actorId,

        authorityGrantId: context.authorityGrantId,

        correlationId: context.correlationId,

        causationId: context.causationId,

        payload: event.payload,

        occurredAt: event.occurredAt,

        recordedAt: persistedEvent.recordedAt,

        previousEventHash: persistedEvent.previousEventHash ?? undefined,

        eventHash: persistedEvent.eventHash ?? undefined,
      },
    };
  } catch (error: unknown) {
    if (isPrismaKnownRequestError(error) && error.code === "P2002") {
      const target = getUniqueTarget(error);

      if (target.includes("eventId")) {
        throw new Error(`[TREASURY_GATEWAY_EVENT_ID_CONFLICT] ${eventId}`);
      }

      if (
        target.includes("aggregateType") &&
        target.includes("aggregateId") &&
        target.includes("aggregateVersion")
      ) {
        throw new Error(
          `[TREASURY_GATEWAY_AGGREGATE_VERSION_CONFLICT] ${aggregate.id}@${aggregate.metadata.version}`,
        );
      }

      throw new Error(
        `[TREASURY_GATEWAY_AGGREGATE_ALREADY_EXISTS] ${aggregate.id}`,
      );
    }

    throw error;
  }
}
