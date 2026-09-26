import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import {
  DIGITAL_SETTLEMENT_V2_RECIPIENTS,
  type DigitalSettlementV2RecipientKey,
} from "../definitions/digitalSettlementV2FinancierRevision";
import {
  DIGITAL_SETTLEMENT_V2_AUDIENCE,
} from "../definitions/digitalSettlementV2Audience";
import {
  INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
  INDERAKSH_SPA_REFERENCE,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "../definitions/inderakshTransactionContinuity";
import { DSI_REFERENCE } from "../definitions/digitalSettlementV1Definition";

type AudienceLinks = Record<
  DigitalSettlementV2RecipientKey,
  string
>;

type AccessGrantIds = Record<
  DigitalSettlementV2RecipientKey,
  string
>;

type AudienceMessage = Readonly<{
  key: DigitalSettlementV2RecipientKey;
  recipient: Readonly<{
    name: string;
    email: string;
  }>;
  subject: string;
  heading: string;
  surface: string;
  authority: string;
  ctaLabel: string;
  lines: readonly string[];
}>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmail(
  message: AudienceMessage,
  accessUrl: string,
) {
  const paragraphs = message.lines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;color:#c7c2b8;font-size:14px;line-height:1.68;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const href = escapeHtml(accessUrl);

  return `<!doctype html><html><body style="margin:0;padding:0;background:#07110d;color:#ebe7dd;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#07110d;"><tr><td align="center" style="padding:32px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border:1px solid #303b35;background:#0b1511;"><tr><td style="padding:28px 30px 16px;border-top:2px solid #b99657;"><p style="margin:0 0 12px;color:#b99657;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">French-Ward · Private Transaction Access</p><p style="margin:0 0 7px;color:#738078;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(INDERAKSH_TRANSACTION_REFERENCE)}</p><h1 style="margin:0;color:#f0ece2;font-size:23px;line-height:1.25;font-weight:500;">${escapeHtml(message.heading)}</h1></td></tr><tr><td style="padding:8px 30px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #39443f;border-bottom:1px solid #39443f;"><tr><td style="padding:14px 0;"><p style="margin:0 0 5px;color:#758078;font-size:9px;letter-spacing:.14em;text-transform:uppercase;">Your Transaction Surface</p><p style="margin:0;color:#d7b76e;font-size:14px;font-weight:600;letter-spacing:.02em;">${escapeHtml(message.surface)}</p><p style="margin:5px 0 0;color:#8a958f;font-size:11px;line-height:1.45;">${escapeHtml(message.authority)}</p></td></tr></table></td></tr><tr><td style="padding:24px 30px 30px;">${paragraphs}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 10px;"><tr><td><a href="${href}" style="display:inline-block;background:#b99657;color:#07151c;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:13px 18px;border-radius:2px;">${escapeHtml(message.ctaLabel)}</a></td></tr></table><p style="margin:10px 0 0;color:#707b80;font-size:10px;line-height:1.55;word-break:break-all;">Your private link: <a href="${href}" style="color:#8f9b9f;text-decoration:underline;">${href}</a></p><p style="margin:12px 0 0;color:#6f7b75;font-size:10px;line-height:1.55;">This link is personal to your access record. Please do not forward it.</p></td></tr><tr><td style="border-top:1px solid #303b35;padding:18px 30px 22px;"><p style="margin:0 0 4px;color:#d8d4cb;font-size:11px;font-weight:600;">French-Ward, Inc.</p><p style="margin:0;color:#66736d;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">Transaction environment via AXPT</p></td></tr></table></td></tr></table></body></html>`;
}

function messages(): readonly AudienceMessage[] {
  return [
    {
      key: "buyerRepresentative",
      recipient:
        DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative,
      subject:
        "Inderaksh Transaction Review — SPA & Commercial Schedule",
      heading: "Your Transaction Review Package Is Ready",
      surface:
        DIGITAL_SETTLEMENT_V2_AUDIENCE.buyerRepresentative.surface,
      authority:
        "Review documents · settlement visibility · no operator controls",
      ctaLabel: "Open Transaction Console",
      lines: [
        "Mr. Keller,",
        "Thank you for your continued coordination with French-Ward as we move the initial 50 KG Gold Doré transaction with Inderaksh Gold Refinery FZ-LLC into formal counterparty review.",
        `The Sales & Purchase Agreement (${INDERAKSH_SPA_REFERENCE}) and Commercial Schedule (${INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE}) are available in your private transaction console as REVIEW COPY · NOT FOR EXECUTION.`,
        "Please confirm that you are duly authorized to execute the SPA and Commercial Schedule on behalf of Inderaksh Gold Refinery FZ-LLC. If another individual is the authorized signatory, please provide the appropriate signatory information before execution copies are released.",
        `The Digital Settlement Instrument (${DSI_REFERENCE}) remains active separately. Current settlement authority remains limited to the 50 USDT verification transfer; the remaining TAP is not authorized.`,
        "Please take the time you need to review the documents. If anything would benefit from clarification before execution, reply to this email and the French-Ward team will address it with you.",
      ],
    },
    {
      key: "financier",
      recipient:
        DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier,
      subject:
        `Private Settlement Access — ${INDERAKSH_TRANSACTION_REFERENCE}`,
      heading: "Your Financier Transaction Access",
      surface:
        DIGITAL_SETTLEMENT_V2_AUDIENCE.financier.surface,
      authority:
        "Settlement · evidence · history / governing documents restricted",
      ctaLabel: "Open Financier Console",
      lines: [
        "Mr. Meisterlin,",
        "French-Ward has prepared a private transaction view for your role as the appointed TAP financier on the Inderaksh transaction.",
        "Your console is focused on the current settlement instruction, applicable evidence, and recorded transaction history. Governing agreement documents and operator controls are not part of this access surface.",
        "At present, the only transfer authority is the 50 USDT verification transfer over the instructed settlement rail. The remaining TAP balance is not authorized unless French-Ward separately records that authority.",
        "Please use your personal link below whenever you need to confirm the current settlement position before acting.",
      ],
    },
    {
      key: "externalReviewer",
      recipient:
        DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer,
      subject:
        `Private Transaction Review Access — ${INDERAKSH_TRANSACTION_REFERENCE}`,
      heading: "Your External Review Access",
      surface:
        DIGITAL_SETTLEMENT_V2_AUDIENCE.externalReviewer.surface,
      authority:
        "Transaction status · recorded milestones / read-only",
      ctaLabel: "Open Review Console",
      lines: [
        "Dr. Hinds,",
        "French-Ward has prepared a private read-only transaction view for your continuing external review access on the Inderaksh transaction.",
        "This surface provides the current transaction position and recorded milestones. Governing documents, settlement coordinates, and operator controls remain restricted to the participants whose roles require them.",
        "Your access is intended to let you stay current with the transaction without changing any authority, instruction, or transaction state.",
      ],
    },
    {
      key: "bobby",
      recipient:
        DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby,
      subject:
        `Internal Transaction Console — ${INDERAKSH_TRANSACTION_REFERENCE}`,
      heading: "French-Ward Internal Operations Access",
      surface:
        DIGITAL_SETTLEMENT_V2_AUDIENCE.bobby.surface,
      authority:
        "Full transaction visibility · read-only participant surface",
      ctaLabel: "Open Internal Console",
      lines: [
        "Bobby,",
        "Your private French-Ward transaction console is ready for the Inderaksh initial 50 KG transaction.",
        "Your internal-operations surface includes the governing review documents, settlement state, evidence view, and transaction history so you can follow the complete record in one place.",
        "Corey Keller is receiving his own separate private Buyer link for counterparty review. Each participant link is personal and resolves to the transaction surface appropriate to that role.",
        "Full visibility does not by itself grant settlement recognition, TAP authorization, document publication, or other operator mutation authority.",
      ],
    },
    {
      key: "lawrence",
      recipient:
        DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence,
      subject:
        `Fiduciary Transaction Console — ${INDERAKSH_TRANSACTION_REFERENCE}`,
      heading: "French-Ward Fiduciary Review Access",
      surface:
        DIGITAL_SETTLEMENT_V2_AUDIENCE.lawrence.surface,
      authority:
        "Full transaction visibility · read-only fiduciary surface",
      ctaLabel: "Open Fiduciary Console",
      lines: [
        "Mr. Lawrence,",
        "Your private fiduciary-review console is ready for the Inderaksh initial 50 KG transaction.",
        "Your surface includes the governing review documents, settlement state, evidence view, and transaction history so the commercial and settlement record can be reviewed together.",
        "Corey Keller is receiving his own separate private Buyer link for counterparty review. Each participant link is personal and resolves to the transaction surface appropriate to that role.",
        "This access provides full transaction visibility for fiduciary review without conferring settlement-recognition, TAP-authorization, document-publication, or other operator mutation authority.",
      ],
    },
  ] as const;
}

export function buildTransactionAudienceAccessEmails(
  accessUrls: AudienceLinks,
) {
  return messages().map((message) => {
    const accessUrl = accessUrls[message.key];

    return {
      ...message,
      accessUrl,
      html: renderEmail(message, accessUrl),
      text: [
        ...message.lines,
        "",
        `Your private link: ${accessUrl}`,
        "Please do not forward this personal access link.",
        "",
        "French-Ward, Inc.",
        "Transaction environment via AXPT",
      ].join("\n"),
    };
  });
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
  message: ReturnType<
    typeof buildTransactionAudienceAccessEmails
  >[number];
  grantId: string;
}) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const type =
    `TX_AUDIENCE_ACCESS_${params.message.key}_${params.grantId}`;
  const successfulStatus =
    mode === "send" ? "SENT" : "LOGGED_ONLY";

  const existing = await prisma.emailLog.findFirst({
    where: {
      type,
      to: params.message.recipient.email,
      subject: params.message.subject,
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
      key: params.message.key,
      ok: true,
      mode,
      alreadyDelivered: true,
      messageId: existing.messageId,
    } as const;
  }

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type,
        from,
        to: params.message.recipient.email,
        subject: params.message.subject,
        messageId: null,
        status: "LOGGED_ONLY",
        rawPayload: {
          mode,
          transactionReference:
            INDERAKSH_TRANSACTION_REFERENCE,
          audienceKey: params.message.key,
          recipient: params.message.recipient,
          grantId: params.grantId,
        },
      },
    });

    return {
      key: params.message.key,
      ok: true,
      mode,
      alreadyDelivered: false,
      messageId: null,
    } as const;
  }

  const response = await resend.emails.send({
    from,
    to: params.message.recipient.email,
    replyTo:
      process.env.DSI_REPLY_TO_EMAIL ||
      "french-ward@axpt.io",
    subject: params.message.subject,
    text: params.message.text,
    html: params.message.html,
  });

  const error = extractResendError(response);
  const messageId = extractResendMessageId(response);

  await prisma.emailLog.create({
    data: {
      type,
      from,
      to: params.message.recipient.email,
      subject: params.message.subject,
      messageId,
      status: error ? "FAILED" : "SENT",
      rawPayload: {
        response,
        error,
        transactionReference:
          INDERAKSH_TRANSACTION_REFERENCE,
        audienceKey: params.message.key,
        recipient: params.message.recipient,
        grantId: params.grantId,
      },
    },
  });

  if (error) {
    throw new Error(
      `[TRANSACTION_AUDIENCE_EMAIL_SEND_FAILED] key=${params.message.key} error=${JSON.stringify(error)}`,
    );
  }

  return {
    key: params.message.key,
    ok: true,
    mode,
    alreadyDelivered: false,
    messageId,
  } as const;
}

export async function sendTransactionAudienceAccessEmails(
  input: {
    accessUrls: AudienceLinks;
    grantIds: AccessGrantIds;
  },
) {
  const rendered =
    buildTransactionAudienceAccessEmails(
      input.accessUrls,
    );

  const results = [];

  for (const message of rendered) {
    results.push(
      await deliverOne({
        message,
        grantId: input.grantIds[message.key],
      }),
    );
  }

  return results;
}
