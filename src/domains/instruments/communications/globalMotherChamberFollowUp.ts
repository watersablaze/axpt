import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { globalMotherV4Definition } from "../definitions/globalMotherV4Definition";

export type GlobalMotherChamberFollowUpInput = Readonly<{
  grantId: string;
  deliveryKey: string;
  recipientName: string;
  recipientEmail: string;
  representedInstitution: string;
  representativeCapacity: string;
  accessUrl: string;
}>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function recipientNameLines(value: string) {
  return value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
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

export function renderGlobalMotherChamberFollowUp(
  input: Omit<GlobalMotherChamberFollowUpInput, "deliveryKey">,
) {
  const nameLines = recipientNameLines(input.recipientName);

  const recipientNameHtml = nameLines
    .map((line) => `<span style="display:block;">${escapeHtml(line)}</span>`)
    .join("");

  const href = escapeHtml(input.accessUrl);

  const subject = "Receipt of Your Chamber Deliberation Record";

  const text = [
    "Your Imperial Majesty Khan-Khan,",
    "",
    "We sincerely acknowledge and appreciate your use of the Chamber and the completion of your deliberation record.",
    "",
    "The Chamber exists so that each participating institution may enter its position directly, in its own capacity, with that position preserved clearly within the shared record.",
    "",
    "Your submission has now been received in full.",
    "",
    "We have noted the areas of alignment, revision, clarification, and disagreement you entered, including your repeated emphasis that the Ahma Olmec Tartarian Government is “the Bridge” in relation to the contemplated gold undertaking.",
    "",
    "That role is already expressly recognized in Article I — Recognition & Relationship, under “AOTG bridge, capacity & restorative purpose,” where AOTG is identified as the bridge opened through the Global Mother’s trust in Imperial Khan-Khan and is acknowledged as carrying its own custodial standing.",
    "",
    "Because that recognition is already present, we want to understand whether your repeated emphasis is simply reaffirming AOTG’s recognized role as the Bridge, or whether you believe the proposal should state more clearly how that role relates to the other institutional relationships, responsibilities, and authorities described within it.",
    "",
    "We also noted your request for clarification regarding mutual respect, clear conditions, and considered action. Since your response returns to AOTG’s role as the Bridge without identifying what part of those principles you are seeking to clarify, we invite you to specify that distinction so it can be addressed directly.",
    "",
    "The Framework remains exactly that: a proposal under deliberation, not a final state. Its purpose is to make alignment, distinction, and needed adjustment visible before any definitive undertaking is formed.",
    "",
    "As the remaining participants enter their positions, the record will continue to show where the common structure is sound, where clarification is needed, and where the proposal itself should be refined.",
    "",
    "We are sincerely glad you chose to enter your position through the Chamber, and we appreciate the seriousness with which you did so.",
    "",
    "Return to your private Chamber:",
    input.accessUrl,
    "",
    "If verification is requested, use the one-time code sent to your authorized email address.",
    "",
    "French-Ward, Inc.",
    "French-Ward Administration",
    "Institutional Environment via AXPT",
  ].join("\n");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0a1926;color:#183447;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a1926;">
<tr>
<td align="center" style="padding:36px 14px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:660px;border:1px solid #36546a;background:#dceaf1;">

<tr>
<td style="padding:31px 34px 24px;background:#112b40;border-top:2px solid #c8ae72;">
  <p style="margin:0 0 12px;color:#cfb87e;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">
    French-Ward · Private Institutional Chamber
  </p>
  <p style="margin:0 0 8px;color:#9eb5c3;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">
    ${escapeHtml(globalMotherV4Definition.reference)}
  </p>
  <h1 style="margin:0;color:#f1eee6;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.28;font-weight:400;">
    Chamber Deliberation Record
  </h1>
</td>
</tr>

<tr>
<td style="padding:24px 34px 0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#edf5f8;border:1px solid #b3c9d5;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 7px;color:#8c733d;font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;">
          Deliberation record
        </p>
        <div style="margin:0;color:#15364d;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.45;">
          ${recipientNameHtml}
        </div>
        <p style="margin:9px 0 0;color:#4d6878;font-size:12px;line-height:1.55;">
          ${escapeHtml(input.representedInstitution)}<br />
          ${escapeHtml(input.representativeCapacity)}
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td style="padding:28px 34px 30px;">

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    Your Imperial Majesty Khan-Khan,
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    We sincerely acknowledge and appreciate your use of the Chamber and the
    completion of your deliberation record.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    The Chamber exists so that each participating institution may enter its
    position directly, in its own capacity, with that position preserved
    clearly within the shared record.
  </p>

  <p style="margin:0 0 22px;color:#18384d;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.5;">
    Your submission has now been received in full.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    We have noted the areas of alignment, revision, clarification, and
    disagreement you entered, including your repeated emphasis that the
    Ahma Olmec Tartarian Government is <strong>“the Bridge”</strong> in
    relation to the contemplated gold undertaking.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    That role is already expressly recognized in
    <strong>Article I — Recognition &amp; Relationship</strong>, under
    <strong>“AOTG bridge, capacity &amp; restorative purpose,”</strong>
    where AOTG is identified as the bridge opened through the Global Mother’s
    trust in Imperial Khan-Khan and is acknowledged as carrying its own
    custodial standing.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    Because that recognition is already present, we want to understand
    whether your repeated emphasis is simply reaffirming AOTG’s recognized
    role as the Bridge, or whether you believe the proposal should state
    more clearly how that role relates to the other institutional
    relationships, responsibilities, and authorities described within it.
  </p>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
    style="margin:22px 0;background:#edf5f8;border:1px solid #b3c9d5;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 7px;color:#8c733d;font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;">
          Clarification invited
        </p>
        <p style="margin:0;color:#24485d;font-size:13px;line-height:1.7;">
          We also noted your request for clarification regarding mutual
          respect, clear conditions, and considered action. Since your
          response returns to AOTG’s role as the Bridge without identifying
          what part of those principles you are seeking to clarify, we invite
          you to specify that distinction so it can be addressed directly.
        </p>
      </td>
    </tr>
  </table>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    The Framework remains exactly that: <strong>a proposal under
    deliberation, not a final state.</strong> Its purpose is to make
    alignment, distinction, and needed adjustment visible before any
    definitive undertaking is formed.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    As the remaining participants enter their positions, the record will
    continue to show where the common structure is sound, where clarification
    is needed, and where the proposal itself should be refined.
  </p>

  <p style="margin:0 0 22px;color:#294b60;font-size:14px;line-height:1.72;">
    We are sincerely glad you chose to enter your position through the
    Chamber, and we appreciate the seriousness with which you did so.
  </p>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 12px;">
    <tr>
      <td>
        <a
          href="${href}"
          style="display:inline-block;background:#142f45;color:#edf5f8;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:14px 20px;border-radius:2px;"
        >
          Return to Private Chamber
        </a>
      </td>
    </tr>
  </table>

  <p style="margin:10px 0 0;color:#657d8b;font-size:11px;line-height:1.65;">
    If verification is requested, use the one-time code sent to your authorized email address.
  </p>
</td>
</tr>

<tr>
<td style="border-top:1px solid #aec2cd;padding:20px 34px 24px;background:#ccdde6;">
  <p style="margin:0 0 4px;color:#18384d;font-size:11px;font-weight:700;">
    French-Ward, Inc.
  </p>
  <p style="margin:0 0 5px;color:#8c733d;font-size:9px;font-weight:700;letter-spacing:.17em;text-transform:uppercase;">
    French-Ward Administration
  </p>
  <p style="margin:0;color:#587181;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">
    Institutional Environment via AXPT
  </p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;

  return {
    subject,
    text,
    html,
  };
}

export async function sendGlobalMotherChamberFollowUp(
  input: GlobalMotherChamberFollowUpInput,
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderGlobalMotherChamberFollowUp(input);

  const type = `GM_CHAMBER_FOLLOW_UP_${input.grantId}_${input.deliveryKey}`;

  const successfulStatus = mode === "send" ? "SENT" : "LOGGED_ONLY";

  const existing = await prisma.emailLog.findFirst({
    where: {
      type,
      to: input.recipientEmail,
      subject: rendered.subject,
      status: successfulStatus,
    },
    select: {
      messageId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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
    grantId: input.grantId,
    deliveryKey: input.deliveryKey,
    recipientName: input.recipientName,
    representedInstitution: input.representedInstitution,
    representativeCapacity: input.representativeCapacity,
  };

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type,
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

  const response = await resend.emails.send({
    from,
    to: input.recipientEmail,
    replyTo: process.env.DSI_REPLY_TO_EMAIL || "french-ward@axpt.io",
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html,
  });

  const error = extractResendError(response);
  const messageId = extractResendMessageId(response);

  await prisma.emailLog.create({
    data: {
      type,
      from,
      to: input.recipientEmail,
      subject: rendered.subject,
      status: error ? "FAILED" : "SENT",
      messageId,
      rawPayload: {
        ...safePayload,
        response,
        error,
      },
    },
  });

  if (error) {
    throw new Error(
      `[GM_CHAMBER_FOLLOW_UP_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    alreadyDelivered: false,
    messageId,
  };
}
