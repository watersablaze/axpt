import type { RecordTreasuryExecutionPlan } from "../commands";

import type {
  TreasuryEventId,
  TreasuryExecutionPlanId,
} from "../../shared/identifiers";

import type { TreasuryCommandContext } from "../../shared/commandContext";

export type RecordTreasuryExecutionPlanDurably = Readonly<{
  planId: TreasuryExecutionPlanId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  payload: RecordTreasuryExecutionPlan["payload"];
}>;
