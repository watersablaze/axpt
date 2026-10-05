import "server-only";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { globalMotherV4Definition } from "../definitions/globalMotherV4Definition";

export type GlobalMotherReminderKind = "EMPRESS" | "NAMA";

export type GlobalMotherChamberReminderInput = Readonly<{
  grantId: string;
  deliveryKey: string;
  kind: GlobalMotherReminderKind;
  recipientName: string;
  recipientEmail: string;
  cc?: string;
  representedInstitution: string;
  representativeCapacity: string;
  accessUrl: string;
}>;

type RenderInput = Omit<GlobalMotherChamberReminderInput, "deliveryKey">;

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

function reminderCopy(kind: GlobalMotherReminderKind) {
  if (kind === "EMPRESS") {
    return {
      subject: "A Gentle Return to the Chamber",
      salutation: "Empress Omaedro II,",
      paragraphs: [
        "We wanted to gently invite you back into the Chamber as we continue this stage of the Global Mother Framework.",
        "The Framework is organized across five articles, moving from relationship and recognition through responsibilities, conditions, and the structure contemplated for the work ahead.",
        "At the conclusion, the Deliberation Register provides the place for you to enter your position directly on each proposition.",
        "This stage is collective by design. Progression into the next phase is dependent upon the responses of all participating parties, so that the shared record is complete before the work moves forward.",
        "Your voice in that record is important to us. We are looking forward to continuing with greater clarity, mutual understanding, and fortitude, and to carrying the work forward in a spirit of honor and grounded purpose.",
      ],
    };
  }

  return {
    subject: "Chamber Deliberation Remains Open",
    salutation: "Imperial Sultan Nama Chancellor,",
    paragraphs: [
      "We wanted to extend a brief follow-up as the Chamber remains open for your review of the Global Mother Framework.",
      "The Framework is arranged across five articles, setting out the contemplated relationships, responsibilities, conditions, and institutional structure in sequence.",
      "At the conclusion, the Deliberation Register provides the place for you to enter your position directly on the propositions presented.",
      "Progression into the next phase is dependent upon the responses of all participants, so that the deliberative record is complete before the work advances.",
      "Your perspective is important to that shared record. We are looking forward to continuing the work with clarity, steadiness, and fortitude, and to moving forward together in a spirit of honor and considered alignment.",
    ],
  };
}

export function renderGlobalMotherChamberReminder(input: RenderInput) {
  const copy = reminderCopy(input.kind);
  const href = escapeHtml(input.accessUrl);

  const text = [
    copy.salutation,
    "",
    ...copy.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    "Return to Private Chamber:",
    input.accessUrl,
    "",
    "If verification is requested, use the one-time code sent to your authorized email address.",
    "",
    "With respect,",
    "",
    "French-Ward, Inc.",
    "French-Ward Administration",
    "Institutional Environment via AXPT",
  ].join("\n");

  const bodyHtml = copy.paragraphs
    .map(
      (paragraph, index) => `
        <p style="${
          index === 3
            ? "margin:0 0 20px;color:#18384d;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.62;"
            : "margin:0 0 18px;color:#294b60;font-size:14px;line-height:1.72;"
        }">
          ${escapeHtml(paragraph)}
        </p>
      `,
    )
    .join("");

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
    Chamber Deliberation
  </h1>
</td>
</tr>

<tr>
<td style="padding:28px 34px 30px;">
  <p style="margin:0 0 20px;color:#294b60;font-size:14px;line-height:1.72;">
    ${escapeHtml(copy.salutation)}
  </p>

  ${bodyHtml}

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 12px;">
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

  <p style="margin:10px 0 24px;color:#657d8b;font-size:11px;line-height:1.65;">
    If verification is requested, use the one-time code sent to your authorized email address.
  </p>

  <p style="margin:0;color:#294b60;font-size:14px;line-height:1.72;">
    With respect,
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
    subject: copy.subject,
    text,
    html,
  };
}

export async function sendGlobalMotherChamberReminder(
  input: GlobalMotherChamberReminderInput,
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderGlobalMotherChamberReminder(input);

  const type = `GM_CHAMBER_DELIBERATION_REMINDER_${input.grantId}_${input.deliveryKey}`;

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
    kind: input.kind,
    recipientName: input.recipientName,
    representedInstitution: input.representedInstitution,
    representativeCapacity: input.representativeCapacity,
    cc: input.cc ?? null,
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
    ...(input.cc ? { cc: input.cc } : {}),
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
      `[GM_CHAMBER_REMINDER_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    alreadyDelivered: false,
    messageId,
  };
}
