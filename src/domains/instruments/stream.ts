import type {
  InstitutionalInstrumentId,
  InstrumentCommandContext,
} from "./contracts";
import type { InstrumentEventType } from "./eventTypes";

export const INSTITUTIONAL_INSTRUMENT_STREAM_TYPE =
  "INSTITUTIONAL_INSTRUMENT" as const;

export type InstitutionalInstrumentStreamType =
  typeof INSTITUTIONAL_INSTRUMENT_STREAM_TYPE;

export type InstrumentDomainEvent = Readonly<{
  streamType: InstitutionalInstrumentStreamType;
  streamId: InstitutionalInstrumentId;
  eventType: InstrumentEventType;
  payload: Readonly<Record<string, unknown>>;
  metadata: Readonly<{
    actorUserId: string;
    accessGrantId?: string;
    correlationId: string;
    causationId?: string;
  }>;
  occurredAt: Date;
}>;

export function createInstrumentDomainEvent(params: {
  instrumentId: InstitutionalInstrumentId;
  eventType: InstrumentEventType;
  payload: Readonly<Record<string, unknown>>;
  context: InstrumentCommandContext;
}): InstrumentDomainEvent {
  const occurredAt = params.context.occurredAt ?? new Date();

  return {
    streamType: INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
    streamId: params.instrumentId,
    eventType: params.eventType,
    payload: params.payload,
    metadata: {
      actorUserId: params.context.actorUserId,
      accessGrantId: params.context.accessGrantId,
      correlationId: params.context.correlationId,
      causationId: params.context.causationId,
    },
    occurredAt,
  };
}
