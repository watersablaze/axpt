export const DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE = {
  INVALID_REQUEST:
    "INVALID_REQUEST",

  NOT_FOUND:
    "NOT_FOUND",

  RECOGNITION_NOT_READY:
    "RECOGNITION_NOT_READY",

  REPORTABLE:
    "REPORTABLE",

  ALREADY_REPORTED:
    "ALREADY_REPORTED",

  ROUTING_COLLISION:
    "ROUTING_COLLISION",

  INTEGRITY_FAILURE:
    "INTEGRITY_FAILURE",

  UNAUTHENTICATED:
    "UNAUTHENTICATED",

  PERMISSION_DENIED:
    "PERMISSION_DENIED",
} as const;

export type DigitalSettlementTreasuryAdmissionState =
  (typeof DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE)[
    keyof typeof DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE
  ];

export function isDigitalSettlementTreasuryAdmissionIntegrityError(
  error:
    unknown,
): boolean {
  if (
    !(error instanceof Error)
  ) {
    return false;
  }

  const message =
    error.message;

  return (
    message.includes(
      "[DSI_TREASURY_CANDIDATE_",
    ) ||
    message.includes(
      "[DSI_TREASURY_PERCEPTION_",
    ) ||
    message.includes(
      "[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_",
    )
  );
}
