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
const verificationAmount =
  DSI_V2_FINANCIER_REVISION.activeAction.authorizedAmountUsdt;
const remainingTap = DSI_V2_FINANCIER_REVISION.activeAction.remainingTapUsdt;
const remainingTapDisplay = Number(remainingTap).toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function messages(input: PreviewInput): readonly Message[] {
  return [
    {
      recipientKey: "financier",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.financier,
      audience: "ACTIVE",
      subject: `Digital Settlement Instruction — ${reference} V2`,
      heading: "Settlement Instruction — Financier",
      authority: `${verificationAmount} USDT VERIFICATION TRANSFER`,
      ctaLabel: "Open Private DSI",
      accessUrl: input.accessUrls.financier,
      lines: [
        `Mr. Meisterlin,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} following clarification from the Buyer group that you are serving as the financier for the Good-Faith Transaction Authorization Payment (TAP).`,
        `The TAP is the transaction-specific payment associated with the Mali export-fee stage. The current step under this private DSI is the transfer of exactly ${verificationAmount} USDT over Ethereum Mainnet USDT to the French-Ward Operations address displayed in the instrument.`,
        `The remaining ${remainingTapDisplay} USDT TAP balance will be addressed separately once the verification transfer has been completed and recognized.`,
        `Please use the private link below to review the settlement coordinates before proceeding. You are encouraged to reply to this email or contact your existing representative with any question or concern.`,
      ],
    },
    {
      recipientKey: "buyerRepresentative",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.buyerRepresentative,
      audience: "REVIEW",
      subject: `Buyer Review — ${reference} V2`,
      heading: "Buyer Representative Review",
      authority: "REVIEW ACCESS · BUYER REPRESENTATIVE",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.buyerRepresentative,
      lines: [
        `Mr. Keller,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} following clarification of the Buyer group's settlement roles.`,
        `Version 2 records ${financier.name} as the financier handling the Good-Faith Transaction Authorization Payment (TAP), which is associated with the Mali export-fee stage.`,
        `The commercial terms, 50 KG quantity, pricing, Ethereum Mainnet USDT rail, and French-Ward Operations address remain unchanged. Your private review link provides visibility into the updated participant structure and the current verification stage.`,
        `You are encouraged to reply to this email or contact your existing representative with any question or concern.`,
      ],
    },
    {
      recipientKey: "externalReviewer",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.externalReviewer,
      audience: "REVIEW",
      subject: `Transaction Review — ${reference} V2`,
      heading: "Transaction Participant Review",
      authority: "REVIEW ACCESS · PARTICIPANT RECORD",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.externalReviewer,
      lines: [
        `Dr. Hinds,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} to reflect the Buyer group's clarification that ${financier.name} serves as financier for the Good-Faith Transaction Authorization Payment (TAP), which is associated with the Mali export-fee stage.`,
        `Your Seller Consultant capacity remains part of the transaction record. The active verification instruction is being handled through ${financier.name}; your private link provides review visibility into the revised DSI and its current position.`,
        `You are encouraged to reply to this email or contact your existing representative with any question or concern.`,
      ],
    },
    {
      recipientKey: "bobby",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.bobby,
      audience: "INTERNAL",
      subject: `Internal Review — ${reference} V2 Role Clarification`,
      heading: "Settlement Role Clarification",
      authority: "INTERNAL REVIEW · V1 PRESERVED",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.bobby,
      lines: [
        `Bobby,`,
        `Version 2 of ${reference} records the clarification that ${financier.name} is handling TAP funding while ${representative.name} remains the authorized Buyer representative.`,
        `The distinction between the Buyer representative and the party actually funding the TAP became clear to AXPT and the French-Ward internal team after the first DSI was prepared. V1 remains preserved as the original record, while V2 presents a clearer participant and access structure.`,
        `Nothing commercial has changed: pricing, the 50 KG quantity, settlement wallet, ${verificationAmount} USDT verification amount, and ${remainingTapDisplay} USDT remaining TAP amount are unchanged.`,
        `The procedural takeaway is that the representative, actual sender of funds, appointed financier, and any special settlement mechanics should be established together before a DSI is prepared. AXPT relies on that information to align access, communications, evidence matching, and authority.`,
      ],
    },
    {
      recipientKey: "lawrence",
      recipient: DIGITAL_SETTLEMENT_V2_RECIPIENTS.lawrence,
      audience: "INTERNAL",
      subject: `Fiduciary Review — ${reference} V2`,
      heading: "Settlement Structure & Version Review",
      authority: "FIDUCIARY REVIEW · VERIFICATION STAGE",
      ctaLabel: "Review DSI Version 2",
      accessUrl: input.accessUrls.lawrence,
      lines: [
        `Mr. Lawrence,`,
        `French-Ward has issued Version 2 of Digital Settlement Instruction ${reference} following clarification of the transaction's funding structure.`,
        `The Good-Faith Transaction Authorization Payment, or TAP, is a transaction-specific pre-SPA payment associated with the Mali export-fee stage. The DSI is the governed instrument used to state settlement coordinates, participant capacities, the current stage, and the instruction presently in effect.`,
        `AXPT supplies the infrastructure for versioning, private access, blockchain observation, evidence preservation, and operator-controlled recognition. Observation, verification, and recognition remain distinct actions.`,
        `The signed LOI records ${financier.name} as a Seller Consultant and ${representative.name} as the authorized Buyer representative. The Buyer group later clarified that ${financier.name} is also funding the TAP. Version 2 records that later operational role while preserving the underlying transaction record.`,
        `The present DSI stage is the ${verificationAmount} USDT verification transfer. The remaining ${remainingTapDisplay} USDT is a separate subsequent step under the French-Ward-controlled process.`,
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
        `<p style="margin:0 0 14px;color:#c7c2b8;font-size:14px;line-height:1.65;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const href = escapeHtml(message.accessUrl);

  return `<!doctype html><html><body style="margin:0;padding:0;background:#07151c;color:#ebe7dd;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#07151c;"><tr><td align="center" style="padding:28px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;border:1px solid #33434c;background:#0a1a22;"><tr><td style="padding:26px 28px 14px;"><p style="margin:0 0 14px;color:#b99657;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">French-Ward / AXPT / Version 2</p><p style="margin:0 0 7px;color:#738188;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(reference)}</p><h1 style="margin:0;color:#f0ece2;font-size:22px;line-height:1.25;font-weight:500;">${escapeHtml(message.heading)}</h1></td></tr><tr><td style="padding:8px 28px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #41515a;border-bottom:1px solid #41515a;"><tr><td style="padding:14px 0;"><p style="margin:0 0 5px;color:#758188;font-size:9px;letter-spacing:.14em;text-transform:uppercase;">Current Stage</p><p style="margin:0;color:#d7b76e;font-size:14px;font-weight:600;letter-spacing:.02em;">${escapeHtml(message.authority)}</p></td></tr></table></td></tr><tr><td style="padding:22px 28px 28px;">${paragraphs}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 10px;"><tr><td><a href="${href}" style="display:inline-block;background:#b99657;color:#07151c;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:12px 18px;border-radius:2px;">${escapeHtml(message.ctaLabel)}</a></td></tr></table><p style="margin:10px 0 0;color:#707b80;font-size:10px;line-height:1.55;word-break:break-all;">Private instrument: <a href="${href}" style="color:#8f9b9f;text-decoration:underline;">${href}</a></p></td></tr><tr><td style="border-top:1px solid #33434c;padding:18px 28px 22px;"><p style="margin:0 0 4px;color:#d8d4cb;font-size:11px;font-weight:600;">French-Ward, Inc.</p><p style="margin:0;color:#66757b;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">Governed through AXPT</p></td></tr></table></td></tr></table></body></html>`;
}

export function buildDigitalSettlementV2EmailPreviews(input: PreviewInput) {
  return messages(input).map((message) => ({
    ...message,
    html: render(message),
    text: message.lines.join("\n"),
  }));
}

export function buildDigitalSettlementV2EmailForRecipient(input: {
  recipientKey: DigitalSettlementV2RecipientKey;
  accessUrl: string;
}) {
  const accessUrls: Record<DigitalSettlementV2RecipientKey, string> = {
    financier: input.accessUrl,
    buyerRepresentative: input.accessUrl,
    externalReviewer: input.accessUrl,
    bobby: input.accessUrl,
    lawrence: input.accessUrl,
  };

  const rendered = buildDigitalSettlementV2EmailPreviews({
    accessUrls,
  });

  const selected = rendered.find(
    (message) =>
      message.recipientKey === input.recipientKey,
  );

  if (!selected) {
    throw new Error(
      `[DSI_V2_EMAIL_RECIPIENT_NOT_FOUND] ${input.recipientKey}`,
    );
  }

  return selected;
}
