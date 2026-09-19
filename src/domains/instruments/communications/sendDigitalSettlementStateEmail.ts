import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { DIGITAL_SETTLEMENT_RECIPIENTS } from "./digitalSettlementRecipients";

export const DIGITAL_SETTLEMENT_EMAIL_EVENT = {
  ISSUED: "ISSUED",
  VERIFICATION_CONFIRMED: "VERIFICATION_CONFIRMED",
  PRINCIPAL_AUTHORIZED: "PRINCIPAL_AUTHORIZED",
} as const;

export type DigitalSettlementEmailEvent =
  (typeof DIGITAL_SETTLEMENT_EMAIL_EVENT)[keyof typeof DIGITAL_SETTLEMENT_EMAIL_EVENT];

type SendDigitalSettlementStateEmailInput = {
  event: DigitalSettlementEmailEvent;
  reference: string;
  accessUrl?: string | null;
  verificationAmountUsdt?: string | null;
  remainingAmountUsdt?: string | null;
  verificationTxHash?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function extractResendError(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    response.error
  ) {
    return response.error;
  }

  return null;
}

function extractResendMessageId(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    "id" in response.data
  ) {
    return String(response.data.id);
  }

  return null;
}

function buyerMessage(input: SendDigitalSettlementStateEmailInput) {
  const verificationAmount = input.verificationAmountUsdt ?? "50";

  switch (input.event) {
    case DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED:
      return {
        subject: `French-Ward Digital Settlement Instruction — ${input.reference}`,
        heading: "Digital Settlement Instruction Issued",
        body: [
          `Mr. Keller,`,
          `French-Ward has issued Digital Settlement Instruction ${input.reference} for the Inderaksh transaction.`,
          `At this stage, only the ${verificationAmount} USDT verification transfer is authorized. Do not transmit the remaining Transaction Authorization Payment until French-Ward separately records that authorization.`,
          input.accessUrl
            ? `Your private instrument link is: ${input.accessUrl}`
            : "Your private instrument link remains the authoritative transaction instruction.",
          "Please retain the same private link throughout the settlement process. Its authorized instruction will update as the transaction advances.",
        ],
      };

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.VERIFICATION_CONFIRMED:
      return {
        subject: `Verification Confirmed — ${input.reference}`,
        heading: "Verification Transfer Confirmed",
        body: [
          `Mr. Keller,`,
          `French-Ward has confirmed receipt of the ${verificationAmount} USDT verification transfer for ${input.reference}.`,
          "The remaining Transaction Authorization Payment remains paused pending separate operator authorization.",
          "Continue to use the same private instrument link. Do not transmit the remaining amount until the instrument expressly shows that principal transfer authority has been released.",
        ],
      };

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.PRINCIPAL_AUTHORIZED:
      return {
        subject: `Transaction Authorization Payment Authorized — ${input.reference}`,
        heading: "Good-Faith TAP Authorized",
        body: [
          `Mr. Keller,`,
          `French-Ward has recorded authorization for the remaining Good-Faith Transaction Authorization Payment under ${input.reference}.`,
          input.remainingAmountUsdt
            ? `The remaining authorized amount is ${input.remainingAmountUsdt} USDT.`
            : "The remaining authorized amount is now displayed in your private instrument.",
          "Please use the same private instrument link and verify the displayed settlement coordinates before transmitting value.",
        ],
      };
  }
}

function internalMessage(input: SendDigitalSettlementStateEmailInput) {
  switch (input.event) {
    case DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED:
      return {
        subject: `DSI Issued — ${input.reference}`,
        body: [
          `Digital Settlement Instruction ${input.reference} has been issued to Corey Keller.`,
          `Authorized buyer action: ${input.verificationAmountUsdt ?? "50"} USDT verification transfer only.`,
          "The remaining TAP is not yet authorized.",
        ],
      };

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.VERIFICATION_CONFIRMED:
      return {
        subject: `DSI Verification Confirmed — ${input.reference}`,
        body: [
          `The verification transfer for ${input.reference} has been confirmed.`,
          input.verificationTxHash
            ? `Transaction hash: ${input.verificationTxHash}`
            : "Transaction hash recorded in the instrument event history.",
          "Principal/TAP authorization is now eligible only after all pricing requirements are satisfied.",
        ],
      };

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.PRINCIPAL_AUTHORIZED:
      return {
        subject: `DSI TAP Authorized — ${input.reference}`,
        body: [
          `The remaining Good-Faith TAP for ${input.reference} has been authorized.`,
          input.remainingAmountUsdt
            ? `Remaining authorized amount: ${input.remainingAmountUsdt} USDT.`
            : "The authorized amount is reflected in the instrument.",
          "The buyer has been notified to proceed through the same private instrument link.",
        ],
      };
  }
}

function toHtml(heading: string, lines: string[]) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
      <h2>${escapeHtml(heading)}</h2>
      ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      <p>French-Ward, Inc.</p>
    </div>
  `;
}

async function deliver(params: {
  type: string;
  to: string | string[];
  subject: string;
  heading: string;
  lines: string[];
  rawPayload: Record<string, unknown>;
}) {
  const from =
    process.env.DSI_FROM_EMAIL ||
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "no-reply@axpt.io";

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const toLog = recipients.join(",");
  const text = [...params.lines, "", "French-Ward, Inc."].join("\n");
  const html = toHtml(params.heading, params.lines);
  const mode = getDigitalSettlementEmailMode();

  const successfulStatus =
    mode === "log" ? "LOGGED_ONLY" : "SENT";

  const existingDelivery = await prisma.emailLog.findFirst({
    where: {
      type: params.type,
      to: toLog,
      subject: params.subject,
      status: successfulStatus,
    },
    select: {
      id: true,
      status: true,
      messageId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingDelivery) {
    return {
      ok: true,
      mode,
      duplicate: false,
      alreadyDelivered: true,
      messageId: existingDelivery.messageId,
    } as const;
  }

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type: params.type,
        from,
        to: toLog,
        subject: params.subject,
        messageId: null,
        status: "LOGGED_ONLY",
        rawPayload: {
          mode: "log",
          ...params.rawPayload,
        },
      },
    });

    return { ok: true, mode: "log" } as const;
  }

  const response = await resend.emails.send({
    from,
    to: recipients,
    subject: params.subject,
    text,
    html,
  });

  const error = extractResendError(response);
  const messageId = extractResendMessageId(response);

  await prisma.emailLog.create({
    data: {
      type: params.type,
      from,
      to: toLog,
      subject: params.subject,
      messageId,
      status: error ? "FAILED" : "SENT",
      rawPayload: {
        response,
        error,
        ...params.rawPayload,
      },
    },
  });

  if (error) {
    throw new Error(`[DSI_EMAIL_SEND_FAILED] ${JSON.stringify(error)}`);
  }

  return { ok: true, mode: "send", messageId } as const;
}

export async function sendDigitalSettlementStateEmail(
  input: SendDigitalSettlementStateEmailInput,
) {
  const buyer = buyerMessage(input);
  const internal = internalMessage(input);

  const buyerResult = await deliver({
    type: `DSI_${input.event}_BUYER`,
    to: DIGITAL_SETTLEMENT_RECIPIENTS.buyer.email,
    subject: buyer.subject,
    heading: buyer.heading,
    lines: buyer.body,
    rawPayload: {
      reference: input.reference,
      event: input.event,
      recipient: DIGITAL_SETTLEMENT_RECIPIENTS.buyer,
    },
  });

  const internalResult = await deliver({
    type: `DSI_${input.event}_INTERNAL`,
    to: DIGITAL_SETTLEMENT_RECIPIENTS.internal.map(
      (recipient) => recipient.email,
    ),
    subject: internal.subject,
    heading: "Digital Settlement Operator Notice",
    lines: internal.body,
    rawPayload: {
      reference: input.reference,
      event: input.event,
      recipients: DIGITAL_SETTLEMENT_RECIPIENTS.internal,
    },
  });

  return {
    buyer: buyerResult,
    internal: internalResult,
  } as const;
}
