import { TREASURY_AGGREGATE_TYPE } from "@/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "@/domains/treasury/gateway/events/eventType";

export const TREASURY_REFLECTION_INTAKE_DISPOSITION = {
  REFLECT: "REFLECT",

  EXAMINE_AND_SKIP: "EXAMINE_AND_SKIP",
} as const;

export type TreasuryReflectionIntakeDisposition =
  (typeof TREASURY_REFLECTION_INTAKE_DISPOSITION)[keyof typeof TREASURY_REFLECTION_INTAKE_DISPOSITION];

export type TreasuryReflectionIntakeClassification = Readonly<{
  disposition: TreasuryReflectionIntakeDisposition;

  aggregateType: string;

  eventType: string;
}>;

/*
 * C3.2B automatic reflection policy is intentionally narrow.
 *
 * Technical validity in TreasuryGatewayEvent does not by itself
 * make an event eligible for automatic Communications reflection.
 *
 * Expansion of this allowlist is a deliberate governance change.
 */
export function classifyTreasuryReflectionIntakeEvent({
  aggregateType,
  eventType,
}: {
  aggregateType: string;

  eventType: string;
}): TreasuryReflectionIntakeClassification {
  const disposition =
    aggregateType === TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION &&
    eventType === TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED
      ? TREASURY_REFLECTION_INTAKE_DISPOSITION.REFLECT
      : TREASURY_REFLECTION_INTAKE_DISPOSITION.EXAMINE_AND_SKIP;

  return {
    disposition,
    aggregateType,
    eventType,
  };
}
