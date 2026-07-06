export function decodeTreasuryReconciliationPassFailure(
  error: unknown,
): Readonly<{
  errorCode: string;

  errorMessage: string;
}> {
  if (error instanceof Error) {
    const codeMatch = error.message.match(/\[([A-Z0-9_]+)\]/);

    return {
      errorCode:
        codeMatch?.[1] ?? "TREASURY_RECONCILIATION_PASS_INFRASTRUCTURE_FAILURE",

      errorMessage: error.message,
    };
  }

  return {
    errorCode: "TREASURY_RECONCILIATION_PASS_INFRASTRUCTURE_FAILURE",

    errorMessage: String(error),
  };
}
