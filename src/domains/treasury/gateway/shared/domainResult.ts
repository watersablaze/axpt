import type { TreasuryEventType } from "../events/eventType";

export type TreasuryEventDescriptor<TPayload> = Readonly<{
  eventType: TreasuryEventType;

  payload: Readonly<TPayload>;

  occurredAt: Date;
}>;

export type TreasuryDomainResult<TAggregate, TPayload> = Readonly<{
  aggregate: TAggregate;

  event: TreasuryEventDescriptor<TPayload>;
}>;
