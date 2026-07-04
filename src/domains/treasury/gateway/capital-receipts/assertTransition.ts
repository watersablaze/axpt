import {
  PROGRAM_CAPITAL_RECEIPT_STATUS,
  type ProgramCapitalReceiptStatus,
} from "./status";

const CAPITAL_RECEIPT_TRANSITIONS: Record<
  ProgramCapitalReceiptStatus,
  ProgramCapitalReceiptStatus[]
> = {
  DRAFT: [
    PROGRAM_CAPITAL_RECEIPT_STATUS.EXPECTED,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED,
  ],

  EXPECTED: [PROGRAM_CAPITAL_RECEIPT_STATUS.REPORTED],

  REPORTED: [PROGRAM_CAPITAL_RECEIPT_STATUS.UNDER_VERIFICATION],

  UNDER_VERIFICATION: [
    PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
    PROGRAM_CAPITAL_RECEIPT_STATUS.REJECTED,
  ],

  VERIFIED: [PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED],

  RECOGNIZED: [PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED],

  REJECTED: [],

  REVERSED: [],
};

export function assertProgramCapitalReceiptTransition(
  from: ProgramCapitalReceiptStatus,
  to: ProgramCapitalReceiptStatus,
) {
  const allowed = CAPITAL_RECEIPT_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new Error(
      `[PROGRAM_CAPITAL_RECEIPT_TRANSITION_INVALID] ${from} -> ${to}`,
    );
  }
}
