import {
  DIGITAL_SETTLEMENT_V2_RECIPIENTS,
  DSI_V2_FINANCIER_REVISION,
  type DigitalSettlementV2RecipientKey,
} from "../definitions/digitalSettlementV2FinancierRevision";

type PreviewInput = Readonly<{
  accessUrls: Record<DigitalSettlementV2RecipientKey, string>;
}>;

type Message = Readonly<{
  recipientKey: DigitalSettlementV2RecipientKey;
  recipient: Readonly<{ name: string; email: string }>;
  audience: "ACTIVE" | "REVIEW" | "INTERNAL";
  subject: string;
  heading: string;
  authority: string;
  ctaLabel: string;
  lines: readonly string[];
  accessUrl: string;
}>;

const reference = DSI_V2_FINANCIER_REVISION.reference;
const financier = DSI_V2_FINANCIER_REVISION.tapFinancier;
const representative = DSI_V2_FINANCIER_REVISION.buyerRepresentative;
const hinds = DSI_V2_FINANCIER_REVISION.externalReviewer;
const verificationAmount =
  DSI_V2_FINANCIER_REVISION.activeAction.authorizedAmountUsdt;
const remainingTap = DSI_V2_FINANCIER_REVISION.activeAction.remainingTapUsdt;
const remainingTapDisplay = Number(remainingTap).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const commonReviewLines = [
  `The Buyer group has clarified that ${financier.name} is the appointed financier for the Good-Faith Transaction Authorization Payment (TAP).`,
  `Version 2 preserves ${representative.name} as the authorized Buyer representative and records ${financier.name} as the active DSI participant expected to complete the ${verificationAmount} USDT verification transfer.`,
  `The remaining ${remainingTapDisplay} USDT TAP balance is not authorized.`,
] as const;

const axptFootnote = `AXPT position: ${DSI_V2_FINANCIER_REVISION.axptPosition}`;
const observerNote = `Blockchain observer: ${DSI_V2_FINANCIER_REVISION.observerPosition}`;

function messages(input: PreviewInput): readonly Message[] {
  return [
    {
      recipientKey: "financier",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier,
      audience: "ACTIVE",
      subject: `Active DSI Updated for Appointed TAP Financier - ${reference} V2`,
      heading: "Active Financier Instruction",
      authority: `${verificationAmount} USDT - VERIFICATION TRANSFER ONLY`,
      ctaLabel: "Open Active DSI",
      accessUrl: input.accessUrls.financier,
      lines: [
        `Mr. Meisterlin,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} for Inderaksh Gold Refinery FZ-LLC following the Buyer group's clarification that you are the appointed financier for the Good-Faith TAP.`,
        `The signed LOI lists you as a Seller Consultant. This Version 2 does not rewrite that source record; it separately records the Buyer group's later financier appointment for this settlement step.`,
        `At this stage, you are authorized to transmit exactly ${verificationAmount} USDT as the verification transfer to the Ethereum USDT address displayed in your private DSI. Do not transmit the remaining ${remainingTapDisplay} USDT TAP balance unless French-Ward separately records and communicates that authorization.`,
        `After the transfer, the AXPT blockchain observer may preserve canonical on-chain evidence. Observation alone does not complete verification: an authorized French-Ward operator must inspect and recognize the evidence before the DSI advances.`,
        `Please use your private link to verify the network, receiving address, and current authority before acting. You may reply to this email or contact your existing representative with any question or concern.`,
        axptFootnote,
      ],
    },
    {
      recipientKey: "buyerRepresentative",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative,
      audience: "REVIEW",
      subject: `Buyer Review - TAP Financier Revision for ${reference} V2`,
      heading: "Buyer Representative Review",
      authority: "REVIEW ACCESS - NO TRANSFER AUTHORITY",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.buyerRepresentative,
      lines: [
        `Mr. Keller,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} for your review in your capacity as Vice President and authorized Buyer representative for Inderaksh Gold Refinery FZ-LLC.`,
        ...commonReviewLines,
        `Your V2 link is a review credential. It does not appoint you as the TAP financier and does not authorize a transfer from you under this revision.`,
        `This update changes participant routing only; it does not change the approved pricing, 50 KG transaction, French-Ward Operations receiving wallet, Ethereum USDT rail, or the requirement for operator recognition after blockchain observation.`,
        `Please reply to this email or contact your existing representative promptly if the recorded financier appointment or any participant capacity is inaccurate.`,
        axptFootnote,
      ],
    },
    {
      recipientKey: "externalReviewer",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer,
      audience: "REVIEW",
      subject: `External Participant Review - ${reference} V2`,
      heading: "Transaction Participant Review",
      authority: "REVIEW ACCESS - NO TRANSFER AUTHORITY",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.externalReviewer,
      lines: [
        `Dr. Hinds,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} for your review in the Seller Consultant capacity recorded for you in the signed Inderaksh LOI.`,
        ...commonReviewLines,
        `Your V2 link is a review credential. The active financier instruction is addressed only to ${financier.name}.`,
        `This revision also makes the operational boundary visible: AXPT may observe the Ethereum USDT rail, but French-Ward retains the separate authority to recognize verification and later decide whether the TAP balance may proceed.`,
        `Please reply to this email or contact your existing representative promptly if the financier appointment or any recorded capacity requires correction.`,
        axptFootnote,
      ],
    },
    {
      recipientKey: "bobby",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby,
      audience: "INTERNAL",
      subject: `Internal Accountability Notice - ${reference} V2 Financier Revision`,
      heading: "Role Clarification Recorded",
      authority: "INTERNAL REVIEW - V1 PRESERVED",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.bobby,
      lines: [
        `Bobby,`,
        `Version 2 of ${reference} has been issued because the Buyer group clarified after V1 issuance that ${financier.name}, not ${representative.name}, is the appointed financier for the Good-Faith TAP.`,
        `AXPT and the French-Ward internal team were not clearly informed of this participant role and funding mechanic before the first instruction was issued. The correction is now being handled through a governed version rather than by informally editing the issued record or allowing an outside party to rewrite the document.`,
        `V1 remains preserved as the historical issuance. V2 changes recipient capacity and access routing only. Pricing, the receiving wallet, the ${verificationAmount} USDT verification requirement, the ${remainingTapDisplay} USDT paused balance, and the observer-recognition boundary remain unchanged.`,
        `Going forward, any change in financier, sender of funds, representative authority, or settlement mechanics should be stated explicitly and brought to AXPT before an instruction is issued. This is necessary for accurate access control, evidence matching, communications, and institutional accountability.`,
        `Please review the V2 presentation and raise any discrepancy before live supersession or communication is authorized.`,
        axptFootnote,
      ],
    },
    {
      recipientKey: "lawrence",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence,
      audience: "INTERNAL",
      subject: `Fiduciary Review - ${reference} V2 Financier Revision`,
      heading: "DSI Version and Authority Review",
      authority: "FIDUCIARY REVIEW - TAP BALANCE PAUSED",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.lawrence,
      lines: [
        `Mr. Lawrence,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} after the Buyer group clarified that ${financier.name} is the person appointed to finance the Good-Faith TAP. The signed LOI records him as a Seller Consultant and records ${representative.name} as the authorized Buyer representative; the later financier appointment therefore requires a governed revision rather than an alteration of the source LOI or silent replacement of the issued DSI.`,
        `The process is: V1 remains preserved; V2 records the corrected participant capacities; distinct private review credentials are prepared for the relevant parties; ${financier.name} receives the active instruction; and all emails and access grants remain pending until an operator separately authorizes live supersession.`,
        `Under V2, only the ${verificationAmount} USDT verification transfer is contemplated. A supervised AXPT observer may record canonical Ethereum USDT evidence, but an authorized French-Ward operator must separately recognize that evidence. The remaining ${remainingTapDisplay} USDT cannot become payable merely because a transfer is observed or recognized; TAP authorization remains a later, independent decision.`,
        `The Buyer, price fixing, 50 KG quantity, French-Ward Operations wallet, settlement network, and commercial amount are unchanged. Please review the revised role allocation and governance boundary and raise any legal or fiduciary concern before live supersession.`,
        axptFootnote,
      ],
    },
  ] as const;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(message: Message) {
  const paragraphs = message.lines
    .map(
      (line) =>
        `<p style="margin:0 0 18px;color:#c7c2b8;font-size:15px;line-height:1.7;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const href = escapeHtml(message.accessUrl);

  return `<!doctype html><html><body style="margin:0;padding:0;background:#07151c;color:#ebe7dd;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#07151c;"><tr><td align="center" style="padding:42px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border:1px solid #33434c;background:#0a1a22;"><tr><td style="padding:34px 34px 18px;"><p style="margin:0 0 24px;color:#b99657;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;">French-Ward / AXPT / Version 2</p><p style="margin:0 0 8px;color:#738188;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">${escapeHtml(reference)}</p><h1 style="margin:0;color:#f0ece2;font-size:28px;line-height:1.2;font-weight:500;">${escapeHtml(message.heading)}</h1></td></tr><tr><td style="padding:12px 34px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #41515a;border-bottom:1px solid #41515a;"><tr><td style="padding:20px 0;"><p style="margin:0 0 7px;color:#758188;font-size:10px;letter-spacing:.16em;text-transform:uppercase;">Current Authority</p><p style="margin:0;color:#d7b76e;font-size:17px;font-weight:600;letter-spacing:.025em;">${escapeHtml(message.authority)}</p></td></tr></table></td></tr><tr><td style="padding:30px 34px 34px;">${paragraphs}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:30px 0 12px;"><tr><td><a href="${href}" style="display:inline-block;background:#b99657;color:#07151c;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:15px 22px;border-radius:2px;">${escapeHtml(message.ctaLabel)}</a></td></tr></table><p style="margin:12px 0 0;color:#707b80;font-size:11px;line-height:1.6;word-break:break-all;">Private instrument: <a href="${href}" style="color:#8f9b9f;text-decoration:underline;">${href}</a></p></td></tr><tr><td style="border-top:1px solid #33434c;padding:22px 34px 28px;"><p style="margin:0 0 5px;color:#ebe7dd;font-size:12px;font-weight:600;">French-Ward, Inc.</p><p style="margin:0;color:#66757b;font-size:10px;letter-spacing:.12em;text-transform:uppercase;">Governed through AXPT</p></td></tr></table></td></tr></table></body></html>`;
}

export function buildDigitalSettlementV2EmailPreviews(input: PreviewInput) {
  return messages(input).map((message) => ({
    ...message,
    html: render(message),
    text: [...message.lines, "", observerNote].join("\n"),
  }));
}
