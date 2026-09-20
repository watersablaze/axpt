import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { DIGITAL_SETTLEMENT_RECIPIENTS } from "./digitalSettlementRecipients";
import { getDigitalSettlementSender } from "./digitalSettlementSender";

export { getDigitalSettlementSender } from "./digitalSettlementSender";

export const DIGITAL_SETTLEMENT_EMAIL_EVENT = {
  ISSUED: "ISSUED",
  VERIFICATION_CONFIRMED: "VERIFICATION_CONFIRMED",
  PRINCIPAL_AUTHORIZED: "PRINCIPAL_AUTHORIZED",
} as const;

export type DigitalSettlementEmailEvent =
  (typeof DIGITAL_SETTLEMENT_EMAIL_EVENT)[keyof typeof DIGITAL_SETTLEMENT_EMAIL_EVENT];

export type SendDigitalSettlementStateEmailInput = {
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
          `At this stage, only the ${verificationAmount} USDT verification transfer is authorized. Do not transmit the remaining Good-Faith Transaction Authorization Payment (TAP) until French-Ward separately records that authorization.`,
          `This ${verificationAmount} USDT transfer serves only as the verification step for the digital settlement channel and does not constitute the remaining TAP.`,
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

function authorityLabel(
  input: SendDigitalSettlementStateEmailInput,
) {
  switch (input.event) {
    case DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED:
      return `${input.verificationAmountUsdt ?? "50"} USDT · VERIFICATION TRANSFER ONLY`;

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.VERIFICATION_CONFIRMED:
      return "VERIFICATION CONFIRMED · TAP BALANCE PAUSED";

    case DIGITAL_SETTLEMENT_EMAIL_EVENT.PRINCIPAL_AUTHORIZED:
      return "GOOD-FAITH TAP · AUTHORIZED";
  }
}

function renderBrandedEmail(params: {
  eyebrow: string;
  reference: string;
  heading: string;
  authority: string;
  lines: string[];
  accessUrl?: string | null;
  ctaLabel?: string | null;
}) {
  const accessUrl = params.accessUrl
    ? escapeHtml(params.accessUrl)
    : null;

  const paragraphs = params.lines
    .map(
      (line) => `
        <p
          style="
            margin:0 0 18px;
            color:#c7c2b8;
            font-size:15px;
            line-height:1.7;
          "
        >
          ${escapeHtml(line)}
        </p>
      `,
    )
    .join("");

  const cta =
    accessUrl && params.ctaLabel
      ? `
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="margin:30px 0 12px;"
        >
          <tr>
            <td>
              <a
                href="${accessUrl}"
                style="
                  display:inline-block;
                  background:#b99657;
                  color:#07151c;
                  text-decoration:none;
                  font-size:12px;
                  font-weight:700;
                  letter-spacing:.12em;
                  text-transform:uppercase;
                  padding:15px 22px;
                  border-radius:2px;
                "
              >
                ${escapeHtml(params.ctaLabel)}
              </a>
            </td>
          </tr>
        </table>

        <p
          style="
            margin:12px 0 0;
            color:#707b80;
            font-size:11px;
            line-height:1.6;
            word-break:break-all;
          "
        >
          Private instrument:
          <a
            href="${accessUrl}"
            style="color:#8f9b9f;text-decoration:underline;"
          >
            ${accessUrl}
          </a>
        </p>
      `
      : "";

  return `
    <!doctype html>
    <html>
      <body
        style="
          margin:0;
          padding:0;
          background:#07151c;
          color:#ebe7dd;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background:#07151c;"
        >
          <tr>
            <td
              align="center"
              style="padding:42px 20px;"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width:640px;
                  border:1px solid #33434c;
                  background:#0a1a22;
                "
              >
                <tr>
                  <td style="padding:34px 34px 18px;">
                    <p
                      style="
                        margin:0 0 24px;
                        color:#b99657;
                        font-size:10px;
                        font-weight:700;
                        letter-spacing:.2em;
                        text-transform:uppercase;
                      "
                    >
                      ${escapeHtml(params.eyebrow)}
                    </p>

                    <p
                      style="
                        margin:0 0 8px;
                        color:#738188;
                        font-size:11px;
                        letter-spacing:.12em;
                        text-transform:uppercase;
                      "
                    >
                      ${escapeHtml(params.reference)}
                    </p>

                    <h1
                      style="
                        margin:0;
                        color:#f0ece2;
                        font-size:28px;
                        line-height:1.2;
                        font-weight:500;
                      "
                    >
                      ${escapeHtml(params.heading)}
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 34px 0;">
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        border-top:1px solid #41515a;
                        border-bottom:1px solid #41515a;
                      "
                    >
                      <tr>
                        <td style="padding:20px 0;">
                          <p
                            style="
                              margin:0 0 7px;
                              color:#758188;
                              font-size:10px;
                              letter-spacing:.16em;
                              text-transform:uppercase;
                            "
                          >
                            Current Authority
                          </p>

                          <p
                            style="
                              margin:0;
                              color:#d7b76e;
                              font-size:17px;
                              font-weight:600;
                              letter-spacing:.025em;
                            "
                          >
                            ${escapeHtml(params.authority)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px 34px 34px;">
                    ${paragraphs}
                    ${cta}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      border-top:1px solid #33434c;
                      padding:22px 34px 28px;
                    "
                  >
                    <p
                      style="
                        margin:0 0 5px;
                        color:#ebe7dd;
                        font-size:12px;
                        font-weight:600;
                      "
                    >
                      French-Ward, Inc.
                    </p>

                    <p
                      style="
                        margin:0;
                        color:#66757b;
                        font-size:10px;
                        letter-spacing:.12em;
                        text-transform:uppercase;
                      "
                    >
                      Governed through AXPT
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildDigitalSettlementEmailPreview(
  input: SendDigitalSettlementStateEmailInput,
) {
  const buyer = buyerMessage(input);
  const internal = internalMessage(input);
  const authority = authorityLabel(input);

  const buyerHtml = renderBrandedEmail({
    eyebrow: "French-Ward / AXPT",
    reference: input.reference,
    heading: buyer.heading,
    authority,
    lines: buyer.body.filter(
      (line) =>
        !line.startsWith("Your private instrument link is:"),
    ),
    accessUrl: input.accessUrl,
    ctaLabel:
      input.event === DIGITAL_SETTLEMENT_EMAIL_EVENT.ISSUED
        ? "View Private Instrument"
        : null,
  });

  const internalHeading =
    "Digital Settlement Operator Notice";

  const internalHtml = renderBrandedEmail({
    eyebrow: "AXPT / French-Ward",
    reference: input.reference,
    heading: internalHeading,
    authority,
    lines: internal.body,
  });

  return {
    buyer: {
      subject: buyer.subject,
      heading: buyer.heading,
      lines: buyer.body,
      text: [
        ...buyer.body,
        "",
        "French-Ward, Inc.",
        "Governed through AXPT",
      ].join("\n"),
      html: buyerHtml,
    },
    internal: {
      subject: internal.subject,
      heading: internalHeading,
      lines: internal.body,
      text: [
        ...internal.body,
        "",
        "French-Ward, Inc.",
        "Governed through AXPT",
      ].join("\n"),
      html: internalHtml,
    },
  } as const;
}

async function deliver(params: {
  type: string;
  to: string | string[];
  subject: string;
  heading: string;
  lines: string[];
  html?: string;
  rawPayload: Record<string, unknown>;
}) {
  const from = getDigitalSettlementSender();

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const toLog = recipients.join(",");
  const text = [
    ...params.lines,
    "",
    "French-Ward, Inc.",
    "Governed through AXPT",
  ].join("\n");

  const html =
    params.html ??
    renderBrandedEmail({
      eyebrow: "French-Ward / AXPT",
      reference: String(
        params.rawPayload.reference ?? "",
      ),
      heading: params.heading,
      authority: "",
      lines: params.lines,
    });

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
    replyTo:
      process.env.DSI_REPLY_TO_EMAIL ||
      "french-ward@axpt.io",
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
  const rendered =
    buildDigitalSettlementEmailPreview(input);

  const buyerResult = await deliver({
    type: `DSI_${input.event}_BUYER`,
    to: DIGITAL_SETTLEMENT_RECIPIENTS.buyer.email,
    subject: buyer.subject,
    heading: buyer.heading,
    lines: buyer.body,
    html: rendered.buyer.html,
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
    html: rendered.internal.html,
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
