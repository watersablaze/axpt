import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { globalMotherV4Definition } from "../definitions/globalMotherV4Definition";

export type GlobalMotherInvitationInput = Readonly<{
  grantId?: string;
  deliveryKey?: string;
  recipientName: string;
  recipientEmail: string;
  representedInstitution: string;
  representativeCapacity: string;
  accessUrl: string | null;
}>;

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

function invitationInstitution(value: string) {
  const normalized = value.trim();

  if (normalized === "AOTG") {
    return "Ahma Olmec Tartarian Government (AOTG)";
  }

  if (normalized === "French-Ward and AOTG") {
    return "French-Ward";
  }

  return normalized;
}

function recipientNameLines(value: string) {
  return value
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function renderGlobalMotherChamberInvitation(
  input: GlobalMotherInvitationInput,
) {
  const displayedInstitution = invitationInstitution(
    input.representedInstitution,
  );

  const nameLines = recipientNameLines(input.recipientName);
  const primaryName = nameLines[0] ?? input.recipientName;

  const recipientNameHtml = nameLines
    .map((line) => `<span style="display:block;">${escapeHtml(line)}</span>`)
    .join("");

  const recipientNameText = nameLines.join("\n");

  const institution = escapeHtml(displayedInstitution);
  const capacity = escapeHtml(input.representativeCapacity);

  const subject =
    "Private Chamber Access — Framework of Royal Custodianship, Restoration & Global Trade";

  const accessText = input.accessUrl
    ? input.accessUrl
    : "[Private access credential will be generated upon approval.]";

  const accessMarkup = input.accessUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 14px;">
        <tr>
          <td>
            <a
              href="${escapeHtml(input.accessUrl)}"
              style="display:inline-block;background:#142f45;color:#edf5f8;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:14px 20px;border-radius:2px;"
            >
              Enter Private Chamber
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:10px 0 0;color:#557083;font-size:10px;line-height:1.55;word-break:break-all;">
        Private link:
        <a
          href="${escapeHtml(input.accessUrl)}"
          style="color:#365a72;text-decoration:underline;"
        >
          ${escapeHtml(input.accessUrl)}
        </a>
      </p>`
    : `<div style="margin:26px 0 8px;display:inline-block;background:#142f45;color:#edf5f8;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:14px 20px;border-radius:2px;">
        Enter Private Chamber
      </div>
      <p style="margin:0 0 14px;color:#557083;font-size:10px;line-height:1.55;">
        Private access link generated upon approval.
      </p>`;

  const text = [
    `Dear ${primaryName},`,
    "",
    "French-Ward has prepared your private Chamber access to the Framework of Royal Custodianship, Restoration & Global Trade, presented for review in your recorded institutional capacity.",
    "",
    "Prepared for:",
    recipientNameText,
    "",
    `Represented institution: ${displayedInstitution}`,
    `Capacity: ${input.representativeCapacity}`,
    "",
    "Use the private access below to enter the Chamber. When prompted, request a verification code; the one-time code will be sent to this email address to confirm access.",
    "",
    accessText,
    "",
    "Once verified, you may review the Framework, view the authorized Chamber Registry, and record your considered response.",
    "",
    "This access is personal to your record and should not be forwarded.",
    "",
    "TOGETHER, WITH INTEGRITY",
    "What endures is built together. Integrity gives continuity its strength, and continuity gives shared purpose room to take form. This Chamber is an opening into that work.",
    "",
    "French-Ward, Inc.",
    "Institutional environment via AXPT",
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
  <h1 style="margin:0;color:#f1eee6;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:400;">
    Framework of Royal Custodianship,<br />
    Restoration &amp; Global Trade
  </h1>
</td>
</tr>

<tr>
<td style="padding:24px 34px 0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#edf5f8;border:1px solid #b3c9d5;">
    <tr>
      <td style="padding:18px 20px;">
        <p style="margin:0 0 7px;color:#8c733d;font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;">
          Prepared for
        </p>
        <div style="margin:0;color:#15364d;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.45;">
          ${recipientNameHtml}
        </div>
        <p style="margin:9px 0 0;color:#4d6878;font-size:12px;line-height:1.55;">
          ${institution}<br />
          ${capacity}
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td style="padding:28px 34px 30px;">
  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    French-Ward has prepared your private Chamber access to the
    <strong>Framework of Royal Custodianship, Restoration &amp; Global Trade</strong>,
    presented for review in your recorded institutional capacity.
  </p>

  <p style="margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;">
    Use the private access below to enter the Chamber. When prompted,
    request a verification code; the one-time code will be sent to this
    email address to confirm access.
  </p>

  ${accessMarkup}

  <p style="margin:19px 0 0;color:#405f71;font-size:12px;line-height:1.7;">
    Once verified, you may review the Framework, view the authorized
    Chamber Registry, and record your considered response.
  </p>

  <p style="margin:13px 0 0;color:#657d8b;font-size:11px;line-height:1.65;">
    This access is personal to your record and should not be forwarded.
  </p>
</td>
</tr>

<tr>
<td style="padding:0 34px 30px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#142f45;border-left:2px solid #c8ae72;">
    <tr>
      <td style="padding:22px 24px;">
        <p style="margin:0 0 10px;color:#cfb87e;font-size:9px;font-weight:700;letter-spacing:.17em;text-transform:uppercase;">
          Together, With Integrity
        </p>
        <p style="margin:0;color:#e7eff2;font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.75;">
          What endures is built together. Integrity gives continuity its
          strength, and continuity gives shared purpose room to take form.
          This Chamber is an opening into that work.
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td style="border-top:1px solid #aec2cd;padding:20px 34px 24px;background:#ccdde6;">
  <p style="margin:0 0 4px;color:#18384d;font-size:11px;font-weight:700;">
    French-Ward, Inc.
  </p>
  <p style="margin:0;color:#587181;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">
    Institutional environment via AXPT
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

export async function sendGlobalMotherChamberInvitation(
  input: GlobalMotherInvitationInput & {
    grantId: string;
    deliveryKey: string;
    accessUrl: string;
  },
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderGlobalMotherChamberInvitation(input);

  const type = `GM_CHAMBER_INVITATION_${input.grantId}_${input.deliveryKey}`;

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
      `[GM_CHAMBER_INVITATION_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    alreadyDelivered: false,
    messageId,
  };
}
