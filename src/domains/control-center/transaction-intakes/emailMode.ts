export type TransactionIntakeEmailMode = "send" | "log";

export function getTransactionIntakeEmailMode(): TransactionIntakeEmailMode {
  return process.env.TRANSACTION_INTAKE_EMAIL_MODE === "log" ? "log" : "send";
}
