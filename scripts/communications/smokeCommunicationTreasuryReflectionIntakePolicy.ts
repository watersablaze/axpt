import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { TREASURY_EVENT_TYPE } from "../../src/domains/treasury/gateway/events/eventType";

import {
  classifyTreasuryReflectionIntakeEvent,
  TREASURY_REFLECTION_INTAKE_DISPOSITION,
} from "../../src/domains/communications/reflections/classifyTreasuryReflectionIntakeEvent";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/*
 * 1. Exact governed outcome is reflectable.
 */
const approvedInstruction = classifyTreasuryReflectionIntakeEvent({
  aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

  eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_APPROVED,
});

assert(
  approvedInstruction.disposition ===
    TREASURY_REFLECTION_INTAKE_DISPOSITION.REFLECT,
  "TREASURY_REFLECTION_POLICY_APPROVED_INSTRUCTION_NOT_REFLECTED",
);

/*
 * 2. Same aggregate, different lifecycle event is examined
 * but not automatically reflected.
 */
const nonApprovedInstruction = classifyTreasuryReflectionIntakeEvent({
  aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_INSTRUCTION,

  eventType: TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_SUBMITTED,
});

assert(
  nonApprovedInstruction.disposition ===
    TREASURY_REFLECTION_INTAKE_DISPOSITION.EXAMINE_AND_SKIP,
  "TREASURY_REFLECTION_POLICY_NON_APPROVED_INSTRUCTION_REFLECTED",
);

/*
 * 3. Different Treasury aggregate must not become reflectable
 * merely because its event vocabulary is otherwise valid.
 */
const executionEvent = classifyTreasuryReflectionIntakeEvent({
  aggregateType: TREASURY_AGGREGATE_TYPE.TREASURY_EXECUTION,

  eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,
});

assert(
  executionEvent.disposition ===
    TREASURY_REFLECTION_INTAKE_DISPOSITION.EXAMINE_AND_SKIP,
  "TREASURY_REFLECTION_POLICY_EXECUTION_EVENT_REFLECTED",
);

/*
 * 4. Unknown vocabulary is also safely examined-and-skipped.
 *
 * The intake classifier is a semantic allowlist, not a source
 * event validator. Source validation remains with Treasury/C3.2A.
 */
const unknownEvent = classifyTreasuryReflectionIntakeEvent({
  aggregateType: "UNKNOWN_TREASURY_AGGREGATE",

  eventType: "UNKNOWN_TREASURY_EVENT",
});

assert(
  unknownEvent.disposition ===
    TREASURY_REFLECTION_INTAKE_DISPOSITION.EXAMINE_AND_SKIP,
  "TREASURY_REFLECTION_POLICY_UNKNOWN_EVENT_REFLECTED",
);

console.log({
  approvedInstructionReflected: true,

  nonApprovedInstructionSkipped: true,

  otherAggregateSkipped: true,

  unknownVocabularySkipped: true,

  policyIsExplicitAllowlist: true,
});
