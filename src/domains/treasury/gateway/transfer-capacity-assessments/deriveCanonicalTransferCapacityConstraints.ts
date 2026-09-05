import type { AvailableCapitalPosition } from "../capital-position/availableCapitalPosition";

import type { TreasuryTransfer } from "../transfers/contracts";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../transfers/contracts";

import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  TRANSFER_CAPACITY_CONSTRAINT_TYPE,
  type TransferCapacityConstraint,
} from "./contracts";

export function deriveCanonicalTransferCapacityConstraints(params: {
  transfer: TreasuryTransfer;

  submittedConstraints: readonly TransferCapacityConstraint[];

  availableCapitalPosition: AvailableCapitalPosition;
}): readonly TransferCapacityConstraint[] {
  const {
    transfer,
    submittedConstraints,
    availableCapitalPosition,
  } = params;

  if (
    transfer.source.kind !==
    TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_SOURCE_FUNDS_PROGRAM_ACCOUNT_SOURCE_REQUIRED] ${transfer.source.kind}`,
    );
  }

  if (
    availableCapitalPosition.programAccountId !==
    transfer.source.programAccountId
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_SOURCE_FUNDS_PROGRAM_ACCOUNT_MISMATCH] ${availableCapitalPosition.programAccountId} -> ${transfer.source.programAccountId}`,
    );
  }

  if (
    availableCapitalPosition.currency !==
      transfer.requestedAmount.currency ||
    availableCapitalPosition.availableAmount.currency !==
      transfer.requestedAmount.currency
  ) {
    throw new Error(
      `[TRANSFER_CAPACITY_SOURCE_FUNDS_CURRENCY_MISMATCH] ${availableCapitalPosition.currency}/${availableCapitalPosition.availableAmount.currency} -> ${transfer.requestedAmount.currency}`,
    );
  }

  const callerAssessableConstraints =
    submittedConstraints.filter(
      (constraint) =>
        constraint.type !==
        TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,
    );

  const canonicalSourceFunds: TransferCapacityConstraint = {
    type: TRANSFER_CAPACITY_CONSTRAINT_TYPE.SOURCE_FUNDS,

    status:
      TRANSFER_CAPACITY_CONSTRAINT_STATUS.APPLICABLE,

    limit: availableCapitalPosition.availableAmount,

    evidenceReferenceIds: [],

    notes:
      "System-derived from authoritative Available Capital Position.",
  };

  return [
    canonicalSourceFunds,

    ...callerAssessableConstraints,
  ];
}
