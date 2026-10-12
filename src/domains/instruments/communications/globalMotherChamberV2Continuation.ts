import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { buildGlobalMotherChamberOrientationPdf } from "./globalMotherChamberOrientation";
import { globalMotherV4Definition } from "../definitions/globalMotherV4Definition";

export const GLOBAL_MOTHER_V2_CONTINUATION_DELIVERY_KEY =
  "GM_CHAMBER_V2_CONTINUATION_KHAN_KHAN_20261012" as const;

export type GlobalMotherChamberV2ContinuationInput = Readonly<{
  grantId: string;
  recipientName: string;
  recipientEmail: string;
  representedInstitution: string;
  representativeCapacity: string;
}>;

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

export function renderGlobalMotherChamberV2Continuation(
  input: GlobalMotherChamberV2ContinuationInput,
) {
  const subject = "Chamber V1 Conclusion & Continuation into Chamber V2";

  const text = [
    "Your Imperial Majesty Khan-Khan,",
    "",
    "French-Ward has concluded Chamber V1 and placed the first deliberative cycle into Intermission while the record, responses, follow-up questions, subsequent clarifications, and practical developments are incorporated into Chamber V2.",
    "",
    "Your recent communication styled as a “rebuttal” was received and reviewed thoroughly.",
    "",
    "That framing is not consistent with the Chamber’s rules or doctrine. The Chamber is a protected deliberative environment intended for clarification, refinement, objection, revision, alignment, and harmony. It is not structured as an adversarial forum in which one participant rebuts another.",
    "",
    "More importantly, our review found that the substance of your communication does not establish a fundamental disagreement requiring rebuttal. We are aligned that refinery readiness, assay, custody, title protection, acceptance procedures, settlement, release instructions, and transaction-specific responsibilities must be addressed before commercial movement occurs.",
    "",
    "The distinction remains one of sequence and instrument layer.",
    "",
    "The refinery is already understood as a principal operational requirement of the collective undertaking. We have since received further clarification regarding the refinery request and associated obligations, which broadened the horizon beyond the initially expressed European refinery focus.",
    "",
    "French-Ward has also begun moving this from concept into action. A Zimbabwe refinery pathway has already been introduced and received with interest, alongside other refinery relationships now being actively considered and developed.",
    "",
    "The transactional details raised in your communication therefore belong in the appropriate commercial layer once the refinery, jurisdiction, authorities, participating institutions, and specific transaction are known. They do not displace the Framework’s prior task of establishing relationship, authority, shared purpose, and conditions for responsible formation.",
    "",
    "It is also part of the Chamber record that the follow-up questions issued after your V1 deliberation responses did not receive a response. Those questions were intended to clarify your positions and strengthen the record. We encourage your full participation in Chamber V2 so those points can be addressed directly and constructively.",
    "",
    "Within the next 48 hours, you will receive updated private access to Chamber V2. This follows clarification of the appropriate channel for the Empress’s review and the additional institutional and operational clarity developed since Chamber V1.",
    "",
    "Your prior positions remain preserved in the record and will continue to inform the next cycle.",
    "",
    "Respectfully,",
    "Jamal Ward",
    "Chief Strategic Officer",
    "French-Ward, Inc.",
  ].join("\n");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0a1926;color:#183447;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1926;">
<tr><td align="center" style="padding:36px 14px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;border:1px solid #36546a;background:#f5f1e8;">
<tr><td style="padding:30px 34px 24px;background:#112b40;border-top:2px solid #c8ae72;">
  <p style="margin:0 0 10px;color:#cfb87e;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">French-Ward · Private Institutional Chamber</p>
  <p style="margin:0 0 8px;color:#9eb5c3;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">${globalMotherV4Definition.reference}</p>
  <h1 style="margin:0;color:#f1eee6;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.28;font-weight:400;">Chamber V1 Conclusion &amp; Continuation into Chamber V2</h1>
</td></tr>
<tr><td style="padding:28px 34px 32px;color:#294b60;font-size:14px;line-height:1.68;">
  <p style="margin:0 0 20px;color:#8c733d;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.45;font-weight:400;">Your Imperial Majesty Khan-Khan,</p>
  <p style="margin:0 0 18px;">French-Ward has concluded Chamber V1 and placed the first deliberative cycle into Intermission while the record, responses, follow-up questions, subsequent clarifications, and practical developments are incorporated into Chamber V2.</p>
  <p style="margin:0 0 18px;">Your recent communication styled as a <strong>“rebuttal”</strong> was received and reviewed thoroughly.</p>
  <p style="margin:0 0 18px;">That framing is not consistent with the Chamber’s rules or doctrine. The Chamber is a protected deliberative environment intended for <strong>clarification, refinement, objection, revision, alignment, and harmony</strong>. It is not structured as an adversarial forum in which one participant rebuts another.</p>
  <p style="margin:0 0 18px;">More importantly, our review found that the substance of your communication does not establish a fundamental disagreement requiring rebuttal. We are aligned that refinery readiness, assay, custody, title protection, acceptance procedures, settlement, release instructions, and transaction-specific responsibilities must be addressed before commercial movement occurs.</p>
  <p style="margin:0 0 18px;"><strong>The distinction remains one of sequence and instrument layer.</strong></p>
  <p style="margin:0 0 18px;">The refinery is already understood as a principal operational requirement of the collective undertaking. We have since received further clarification regarding the refinery request and associated obligations, which broadened the horizon beyond the initially expressed European refinery focus.</p>
  <p style="margin:0 0 18px;">French-Ward has also begun moving this from concept into action. A Zimbabwe refinery pathway has already been introduced and received with interest, alongside other refinery relationships now being actively considered and developed.</p>
  <p style="margin:0 0 18px;">The transactional details raised in your communication therefore belong in the appropriate commercial layer once the refinery, jurisdiction, authorities, participating institutions, and specific transaction are known. They do not displace the Framework’s prior task of establishing relationship, authority, shared purpose, and conditions for responsible formation.</p>
  <p style="margin:0 0 18px;">It is also part of the Chamber record that the follow-up questions issued after your V1 deliberation responses did not receive a response. Those questions were intended to clarify your positions and strengthen the record. We encourage your full participation in Chamber V2 so those points can be addressed directly and constructively.</p>
  <p style="margin:0 0 18px;"><strong>Within the next 48 hours, you will receive updated private access to Chamber V2.</strong> This follows clarification of the appropriate channel for the Empress’s review and the additional institutional and operational clarity developed since Chamber V1.</p>
  <p style="margin:0 0 24px;">Your prior positions remain preserved in the record and will continue to inform the next cycle.</p>
  <p style="margin:0;">Respectfully,<br /><strong>Jamal Ward</strong><br />Chief Strategic Officer<br /><strong>French-Ward, Inc.</strong></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { to: input.recipientEmail, subject, text, html };
}

export async function sendGlobalMotherChamberV2Continuation(
  input: GlobalMotherChamberV2ContinuationInput,
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderGlobalMotherChamberV2Continuation(input);
  const successfulStatus = mode === "send" ? "SENT" : "LOGGED_ONLY";

  const existing = await prisma.emailLog.findFirst({
    where: {
      type: GLOBAL_MOTHER_V2_CONTINUATION_DELIVERY_KEY,
      to: input.recipientEmail,
      subject: rendered.subject,
      status: successfulStatus,
    },
    select: { messageId: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return {
      ok: true as const,
      mode,
      alreadyDelivered: true,
      messageId: existing.messageId,
    };
  }

  const safePayload = {
    mode,
    instrumentReference: globalMotherV4Definition.reference,
    communication: "CHAMBER_V1_CONCLUSION_V2_CONTINUATION",
    grantId: input.grantId,
    recipientName: input.recipientName,
    representedInstitution: input.representedInstitution,
    representativeCapacity: input.representativeCapacity,
    privateCredentialIncluded: false,
    attachment:
      "Chamber-Orientation-GM-KENYA-RCF-001-Chamber-V2.pdf",
  };

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type: GLOBAL_MOTHER_V2_CONTINUATION_DELIVERY_KEY,
        from,
        to: input.recipientEmail,
        subject: rendered.subject,
        status: "LOGGED_ONLY",
        messageId: null,
        rawPayload: safePayload,
      },
    });

    return {
      ok: true as const,
      mode: "log" as const,
      alreadyDelivered: false,
      messageId: null,
    };
  }

  const pdf = await buildGlobalMotherChamberOrientationPdf();

  const response = await resend.emails.send({
    from,
    to: input.recipientEmail,
    replyTo: process.env.DSI_REPLY_TO_EMAIL || "french-ward@axpt.io",
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
    attachments: [
      {
        filename: "Chamber-Orientation-GM-KENYA-RCF-001-Chamber-V2.pdf",
        content: pdf,
      },
    ],
  });

  const error = extractResendError(response);
  const messageId = extractResendMessageId(response);

  await prisma.emailLog.create({
    data: {
      type: GLOBAL_MOTHER_V2_CONTINUATION_DELIVERY_KEY,
      from,
      to: input.recipientEmail,
      subject: rendered.subject,
      status: error ? "FAILED" : "SENT",
      messageId,
      rawPayload: { ...safePayload, response, error },
    },
  });

  if (error) {
    throw new Error(
      `[GM_CHAMBER_V2_CONTINUATION_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    alreadyDelivered: false,
    messageId,
  };
}
