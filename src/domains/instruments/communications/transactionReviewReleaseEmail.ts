import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { DIGITAL_SETTLEMENT_RECIPIENTS } from "./digitalSettlementRecipients";
import {
  INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
  INDERAKSH_SPA_REFERENCE,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "../definitions/inderakshTransactionContinuity";
import { DSI_REFERENCE } from "../definitions/digitalSettlementV1Definition";

type ReviewReleaseInput = Readonly<{
  accessUrl: string;
  spaVersion: number;
  spaSha256: string;
  commercialScheduleVersion: number;
  commercialScheduleSha256: string;
}>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmail(params: {
  heading: string;
  authority: string;
  lines: readonly string[];
  accessUrl?: string | null;
  ctaLabel?: string | null;
}) {
  const paragraphs = params.lines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;color:#c7c2b8;font-size:14px;line-height:1.68;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const href = params.accessUrl
    ? escapeHtml(params.accessUrl)
    : null;

  const cta =
    href && params.ctaLabel
      ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 10px;"><tr><td><a href="${href}" style="display:inline-block;background:#b99657;color:#07151c;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:13px 18px;border-radius:2px;">${escapeHtml(params.ctaLabel)}</a></td></tr></table><p style="margin:10px 0 0;color:#707b80;font-size:10px;line-height:1.55;word-break:break-all;">Private transaction console: <a href="${href}" style="color:#8f9b9f;text-decoration:underline;">${href}</a></p>`
      : "";

  return `<!doctype html><html><body style="margin:0;padding:0;background:#07110d;color:#ebe7dd;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#07110d;"><tr><td align="center" style="padding:32px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border:1px solid #303b35;background:#0b1511;"><tr><td style="padding:28px 30px 16px;border-top:2px solid #b99657;"><p style="margin:0 0 12px;color:#b99657;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">French-Ward · Transaction Review</p><p style="margin:0 0 7px;color:#738078;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(INDERAKSH_TRANSACTION_REFERENCE)}</p><h1 style="margin:0;color:#f0ece2;font-size:23px;line-height:1.25;font-weight:500;">${escapeHtml(params.heading)}</h1></td></tr><tr><td style="padding:8px 30px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #39443f;border-bottom:1px solid #39443f;"><tr><td style="padding:14px 0;"><p style="margin:0 0 5px;color:#758078;font-size:9px;letter-spacing:.14em;text-transform:uppercase;">Current Transaction State</p><p style="margin:0;color:#d7b76e;font-size:14px;font-weight:600;letter-spacing:.02em;">${escapeHtml(params.authority)}</p></td></tr></table></td></tr><tr><td style="padding:24px 30px 30px;">${paragraphs}${cta}</td></tr><tr><td style="border-top:1px solid #303b35;padding:18px 30px 22px;"><p style="margin:0 0 4px;color:#d8d4cb;font-size:11px;font-weight:600;">French-Ward, Inc.</p><p style="margin:0;color:#66736d;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">Transaction environment via AXPT</p></td></tr></table></td></tr></table></body></html>`;
}

export function buildTransactionReviewReleaseEmail(
  input: ReviewReleaseInput,
) {
  const buyer = {
    recipient: DIGITAL_SETTLEMENT_RECIPIENTS.buyer,
    subject:
      "Inderaksh Transaction Review — SPA & Commercial Schedule",
    heading: "Counterparty Review Package Available",
    authority: "REVIEW COPY · NOT FOR EXECUTION",
    lines: [
      "Mr. Keller,",
      "Thank you for your continued coordination with French-Ward as we move the initial 50 KG Gold Doré transaction with Inderaksh Gold Refinery FZ-LLC into formal counterparty review.",
      `The Sales & Purchase Agreement (${INDERAKSH_SPA_REFERENCE}) and Commercial Schedule (${INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE}) are now available through your private AXPT transaction console for review. Both documents are presently issued as REVIEW COPY · NOT FOR EXECUTION.`,
      "As part of this review, please confirm that you are duly authorized to execute the SPA and Commercial Schedule on behalf of Inderaksh Gold Refinery FZ-LLC. If another individual is the authorized signatory, please provide the appropriate signatory information before execution copies are released.",
      `The Digital Settlement Instrument (${DSI_REFERENCE}) remains active separately. The present settlement authority remains limited to the 50 USDT verification transfer; the remaining TAP is not authorized.`,
      "Please take the time you need to review the documents. If anything would benefit from clarification before execution, reply to this email and the French-Ward team will address it with you.",
    ] as const,
  };

  const internal = {
    recipients: DIGITAL_SETTLEMENT_RECIPIENTS.internal,
    subject:
      `Counterparty Review Released — ${INDERAKSH_TRANSACTION_REFERENCE}`,
    heading: "Counterparty Review Release",
    authority: "DOCUMENTS · REVIEW / EXECUTION · NOT RELEASED",
    lines: [
      `The counterparty review package for ${INDERAKSH_TRANSACTION_REFERENCE} has been released for Buyer review.`,
      `Corey Keller has been sent his current private, individual AXPT transaction-console link directly at ${DIGITAL_SETTLEMENT_RECIPIENTS.buyer.email}. That credential is specific to his Buyer access and should not be forwarded.`,
      `Review documents: ${INDERAKSH_SPA_REFERENCE} and ${INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE}.`,
      "Execution copies have not been released. Buyer signatory confirmation remains the next agreement gate.",
      `The DSI remains independently active at the verification-transfer stage. Current authority is limited to 50 USDT; the remaining TAP is not authorized.`,
    ] as const,
  };

  return {
    buyer: {
      ...buyer,
      html: renderEmail({
        heading: buyer.heading,
        authority: buyer.authority,
        lines: buyer.lines,
        accessUrl: input.accessUrl,
        ctaLabel: "Review Transaction Documents",
      }),
      text: [
        ...buyer.lines,
        "",
        `Private transaction console: ${input.accessUrl}`,
        "",
        "French-Ward, Inc.",
        "Transaction environment via AXPT",
      ].join("\n"),
    },
    internal: {
      ...internal,
      html: renderEmail({
        heading: internal.heading,
        authority: internal.authority,
        lines: internal.lines,
      }),
      text: [
        ...internal.lines,
        "",
        "French-Ward, Inc.",
        "Transaction environment via AXPT",
      ].join("\n"),
    },
    releaseKey:
      `spa-v${input.spaVersion}-${input.spaSha256.slice(0, 12)}_cp-v${input.commercialScheduleVersion}-${input.commercialScheduleSha256.slice(0, 12)}`,
  } as const;
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

async function deliverOne(params: {
  type: string;
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  rawPayload: Record<string, unknown>;
}) {
  const from = getDigitalSettlementSender();
  const recipients = Array.isArray(params.to)
    ? params.to
    : [params.to];
  const toLog = recipients.join(",");
  const mode = getDigitalSettlementEmailMode();
  const successfulStatus =
    mode === "send" ? "SENT" : "LOGGED_ONLY";

  const existing = await prisma.emailLog.findFirst({
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
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return {
      ok: true,
      mode,
      alreadyDelivered: true,
      messageId: existing.messageId,
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
          mode,
          ...params.rawPayload,
        },
      },
    });

    return {
      ok: true,
      mode,
      alreadyDelivered: false,
      messageId: null,
    } as const;
  }

  const response = await resend.emails.send({
    from,
    to: recipients,
    replyTo:
      process.env.DSI_REPLY_TO_EMAIL ||
      "french-ward@axpt.io",
    subject: params.subject,
    text: params.text,
    html: params.html,
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
    throw new Error(
      `[TRANSACTION_REVIEW_EMAIL_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true,
    mode,
    alreadyDelivered: false,
    messageId,
  } as const;
}

export async function sendTransactionReviewReleaseEmail(
  input: ReviewReleaseInput,
) {
  const message =
    buildTransactionReviewReleaseEmail(input);

  const buyerType =
    `TX_COUNTERPARTY_REVIEW_RELEASED_${message.releaseKey}_BUYER`;
  const internalType =
    `TX_COUNTERPARTY_REVIEW_RELEASED_${message.releaseKey}_INTERNAL`;

  const buyer = await deliverOne({
    type: buyerType,
    to: message.buyer.recipient.email,
    subject: message.buyer.subject,
    text: message.buyer.text,
    html: message.buyer.html,
    rawPayload: {
      transactionReference:
        INDERAKSH_TRANSACTION_REFERENCE,
      documentState: "REVIEW",
      executionState: "NOT_RELEASED",
      spaVersion: input.spaVersion,
      spaSha256: input.spaSha256,
      commercialScheduleVersion:
        input.commercialScheduleVersion,
      commercialScheduleSha256:
        input.commercialScheduleSha256,
      recipient: message.buyer.recipient,
    },
  });

  const internal = await deliverOne({
    type: internalType,
    to: message.internal.recipients.map(
      (recipient) => recipient.email,
    ),
    subject: message.internal.subject,
    text: message.internal.text,
    html: message.internal.html,
    rawPayload: {
      transactionReference:
        INDERAKSH_TRANSACTION_REFERENCE,
      documentState: "REVIEW",
      executionState: "NOT_RELEASED",
      spaVersion: input.spaVersion,
      spaSha256: input.spaSha256,
      commercialScheduleVersion:
        input.commercialScheduleVersion,
      commercialScheduleSha256:
        input.commercialScheduleSha256,
      recipients: message.internal.recipients,
    },
  });

  return {
    buyer,
    internal,
    releaseKey: message.releaseKey,
  } as const;
}
