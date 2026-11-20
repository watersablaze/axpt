import {
  INSTRUMENT_PROPOSITION_STATE,
  INSTRUMENT_RESOLUTION_STATE,
  INSTRUMENT_RESPONSE_TYPE,
  type InstrumentPropositionState,
  type InstrumentResolutionState,
  type InstrumentResponseType,
} from "../contracts";

/**
 * Derive the deliberative resolution for one proposition
 * from the actor's current, non-superseded response.
 *
 * This function does not mutate proposition state,
 * instrument lifecycle, authority, or persistence.
 */
export function deriveInstrumentPropositionResolution(params: {
  propositionState: InstrumentPropositionState;
  responseType: InstrumentResponseType | null;
}): InstrumentResolutionState {
  const {
    propositionState,
    responseType,
  } = params;

  if (responseType === null) {
    return INSTRUMENT_RESOLUTION_STATE.UNRESPONDED;
  }

  switch (responseType) {
    case INSTRUMENT_RESPONSE_TYPE.ACKNOWLEDGE:
      return INSTRUMENT_RESOLUTION_STATE.RECEIVED;

    case INSTRUMENT_RESPONSE_TYPE.AFFIRM:
      /*
       * OPEN means substantive definition remains incomplete.
       * Affirming an open proposition records reception /
       * affirmative posture, but does not close the matter.
       */
      if (
        propositionState ===
        INSTRUMENT_PROPOSITION_STATE.OPEN
      ) {
        return INSTRUMENT_RESOLUTION_STATE.RECEIVED;
      }

      return INSTRUMENT_RESOLUTION_STATE.ALIGNED;

    case INSTRUMENT_RESPONSE_TYPE.CLARIFY:
      return INSTRUMENT_RESOLUTION_STATE.CLARIFICATION_OPEN;

    case INSTRUMENT_RESPONSE_TYPE.REVISE:
      return INSTRUMENT_RESOLUTION_STATE.REVISION_PENDING;

    case INSTRUMENT_RESPONSE_TYPE.DECLINE:
      return INSTRUMENT_RESOLUTION_STATE.NOT_ALIGNED;
  }
}
