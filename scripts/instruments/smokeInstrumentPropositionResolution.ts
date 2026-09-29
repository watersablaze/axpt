import {
  INSTRUMENT_PROPOSITION_STATE,
  INSTRUMENT_RESOLUTION_STATE,
  INSTRUMENT_RESPONSE_TYPE,
} from "../../src/domains/instruments/contracts";
import {
  deriveInstrumentPropositionResolution,
} from "../../src/domains/instruments/invariants/deriveInstrumentPropositionResolution";

const cases = [
  {
    name: "no response",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType: null,
    expected:
      INSTRUMENT_RESOLUTION_STATE.UNRESPONDED,
  },
  {
    name: "acknowledge proposed",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.ACKNOWLEDGE,
    expected:
      INSTRUMENT_RESOLUTION_STATE.RECEIVED,
  },
  {
    name: "affirm proposed",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.AFFIRM,
    expected:
      INSTRUMENT_RESOLUTION_STATE.ALIGNED,
  },
  {
    name: "affirm confirmed",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.CONFIRMED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.AFFIRM,
    expected:
      INSTRUMENT_RESOLUTION_STATE.ALIGNED,
  },
  {
    name: "affirm understood",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.UNDERSTOOD,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.AFFIRM,
    expected:
      INSTRUMENT_RESOLUTION_STATE.ALIGNED,
  },
  {
    name: "affirm open does not close",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.OPEN,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.AFFIRM,
    expected:
      INSTRUMENT_RESOLUTION_STATE.RECEIVED,
  },
  {
    name: "clarify",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.CLARIFY,
    expected:
      INSTRUMENT_RESOLUTION_STATE.CLARIFICATION_OPEN,
  },
  {
    name: "revise",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.REVISE,
    expected:
      INSTRUMENT_RESOLUTION_STATE.REVISION_PENDING,
  },
  {
    name: "decline",
    propositionState:
      INSTRUMENT_PROPOSITION_STATE.PROPOSED,
    responseType:
      INSTRUMENT_RESPONSE_TYPE.DECLINE,
    expected:
      INSTRUMENT_RESOLUTION_STATE.NOT_ALIGNED,
  },
] as const;

for (const testCase of cases) {
  const actual =
    deriveInstrumentPropositionResolution({
      propositionState:
        testCase.propositionState,
      responseType:
        testCase.responseType,
    });

  console.log(
    JSON.stringify(
      {
        case: testCase.name,
        actual,
        expected:
          testCase.expected,
      },
      null,
      2,
    ),
  );

  if (actual !== testCase.expected) {
    throw new Error(
      `[GM_G2F_RESOLUTION_MISMATCH] ${testCase.name}: expected ${testCase.expected}, got ${actual}`,
    );
  }
}

console.log(
  "GM_G2F_RESOLUTION_MATRIX_VALID",
);
