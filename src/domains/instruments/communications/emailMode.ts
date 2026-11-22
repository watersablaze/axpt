export type DigitalSettlementEmailMode = "send" | "log";

export function getDigitalSettlementEmailMode(): DigitalSettlementEmailMode {
  return process.env.DSI_EMAIL_MODE === "send" ? "send" : "log";
}
