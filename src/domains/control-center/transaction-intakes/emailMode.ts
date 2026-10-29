export type TransactionIntakeEmailMode = "send" | "log";

export function getTransactionIntakeEmailMode(): TransactionIntakeEmailMode {
  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "development" ||
    process.env.NODE_ENV !== "production"
  ) {
    return "log";
  }

  return process.env.TRANSACTION_INTAKE_EMAIL_MODE === "log"
    ? "log"
    : "send";
}
