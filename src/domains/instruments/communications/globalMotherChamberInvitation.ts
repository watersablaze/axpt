import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { globalMotherV3Definition } from "../definitions/globalMotherV3Definition";

type GlobalMotherInvitationInput = Readonly<{
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

function renderInvitation(input: GlobalMotherInvitationInput) {
  const recipientName = escapeHtml(input.recipientName);
  const institution = escapeHtml(input.representedInstitution);
  const capacity = escapeHtml(input.representativeCapacity);
  const href = escapeHtml(input.accessUrl);

  const subject =
    "Private Chamber Invitation — Framework of Royal Custodianship, Restoration & Global Trade";

  const text = [
    `Dear ${input.recipientName},`,
    "",
    "French-Ward has prepared private Chamber access for you to review the Framework of Royal Custodianship, Restoration & Global Trade in your presented institutional capacity.",
    "",
    `Represented institution: ${input.representedInstitution}`,
    `Capacity: ${input.representativeCapacity}`,
    "",
    "Open your private Chamber link below. When prompted, request a verification code; the one-time code will be sent to this email address to confirm access.",
    "",
    input.accessUrl,
    "",
    "After verification, you may enter the Chamber, review the Framework, view the authorized Chamber Registry, and record your considered response.",
    "",
    "This private link is personal to your access record. Please do not forward it.",
    "",
    "French-Ward, Inc.",
    "Institutional environment via AXPT",
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0b1722;color:#eee8dc;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b1722;"><tr><td align="center" style="padding:34px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:650px;border:1px solid #314452;background:#102230;"><tr><td style="padding:30px 32px 18px;border-top:2px solid #c4aa70;"><p style="margin:0 0 12px;color:#ccb581;font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">French-Ward · Private Institutional Chamber</p><p style="margin:0 0 7px;color:#8fa0aa;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(globalMotherV3Definition.reference)}</p><h1 style="margin:0;color:#f1ebdf;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;font-weight:400;">Framework of Royal Custodianship, Restoration &amp; Global Trade</h1></td></tr><tr><td style="padding:8px 32px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #354957;border-bottom:1px solid #354957;"><tr><td style="padding:15px 0;"><p style="margin:0 0 5px;color:#ccb581;font-size:9px;letter-spacing:.14em;text-transform:uppercase;">Prepared for</p><p style="margin:0;color:#f0e9dc;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.35;">${recipientName}</p><p style="margin:6px 0 0;color:#bdc9cf;font-size:12px;line-height:1.5;">${institution} · ${capacity}</p></td></tr></table></td></tr><tr><td style="padding:25px 32px 32px;"><p style="margin:0 0 16px;color:#cad4d9;font-size:14px;line-height:1.68;">French-Ward has prepared private Chamber access for you to review the Framework in your presented institutional capacity.</p><p style="margin:0 0 16px;color:#cad4d9;font-size:14px;line-height:1.68;">Open the private link below. When prompted, request a verification code; the one-time code will be sent to this email address to confirm access.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 12px;"><tr><td><a href="${href}" style="display:inline-block;background:#e6dcc3;color:#132837;text-decoration:none;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:14px 19px;border-radius:2px;">Enter Private Chamber</a></td></tr></table><p style="margin:10px 0 0;color:#84949d;font-size:10px;line-height:1.55;word-break:break-all;">Private link: <a href="${href}" style="color:#aab9c0;text-decoration:underline;">${href}</a></p><p style="margin:15px 0 0;color:#8d9aa1;font-size:11px;line-height:1.6;">After verification, you may review the Framework, view the authorized Chamber Registry, and record your considered response. This link is personal to your access record; please do not forward it.</p></td></tr><tr><td style="border-top:1px solid #314452;padding:19px 32px 23px;"><p style="margin:0 0 4px;color:#ded9cf;font-size:11px;font-weight:600;">French-Ward, Inc.</p><p style="margin:0;color:#758690;font-size:9px;letter-spacing:.1em;text-transform:uppercase;">Institutional environment via AXPT</p></td></tr></table></td></tr></table></body></html>`;

  return { subject, text, html };
}

export async function sendGlobalMotherChamberInvitation(
  input: GlobalMotherInvitationInput,
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderInvitation(input);
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
    instrumentReference: globalMotherV3Definition.reference,
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
    replyTo:
      process.env.DSI_REPLY_TO_EMAIL ||
      "french-ward@axpt.io",
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
