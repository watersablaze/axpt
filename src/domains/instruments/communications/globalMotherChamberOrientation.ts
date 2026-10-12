import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";
import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { globalMotherV5Definition } from "../definitions/globalMotherV5Definition";

export const GLOBAL_MOTHER_ORIENTATION_DELIVERY_KEY =
  "GM_CHAMBER_V2_ORIENTATION_JACQUELINE_DWYER_20261012" as const;

export type GlobalMotherChamberOrientationInput = Readonly<{
  recipientEmail: string;
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

const orientationSections = [
  {
    heading: "Purpose",
    paragraphs: [
      "The Chamber is a private working environment where participating parties reach shared clarity before agreements and execution.",
      "It establishes the relationship being formed; each party's standing and responsibilities; the pathway for the gold work; open questions requiring refinement; and the conditions required before coordinated action begins.",
    ],
  },
  {
    heading: "The Record",
    paragraphs: [
      "The Chamber also carries the developing record of the work already underway.",
      "Chamber V1 captured the first formal cycle of review and response. Chamber V2 continues from that foundation, incorporating the discussions, clarifications, questions, and direction that have emerged over more than 30 days of engagement.",
      "What is being delivered now is therefore not a new proposal beginning from zero. It is the next organized expression of work already in motion - being preserved, refined, and tended to with greater clarity and continuity.",
    ],
  },
  {
    heading: "French-Ward's Role",
    paragraphs: [
      "French-Ward, Inc. serves from a custodial and commercial position.",
      "Drawing on its precious-minerals custodianship, gold-trade relationships, commodity experience, and coordination work, French-Ward holds the Framework, preserves the developing record, organizes collective input, and keeps the work connected to commercial reality.",
      "This is service to the shared undertaking.",
    ],
  },
  {
    heading: "The Collective",
    paragraphs: [
      "Each participating party brings its own standing, authority, experience, and responsibilities. The Chamber is where those perspectives meet and help shape the Framework.",
      "The Empress: Reviews the developing structure and contributes guidance from her position within the work.",
      "Friends of Farmers: Receives the Chamber materials, understands what is being delivered, and ensures they reach the Empress through her designated channel.",
    ],
  },
  {
    heading: "The Goal",
    paragraphs: [
      "To move the participating parties from shared intention into coordinated action, with clarity around relationship, responsibility, gold passage, and readiness.",
      "The work ultimately serves the wider restorative and economic aims the participants share for their communities and the Global Family.",
    ],
  },
  {
    heading: "Why the Chamber Exists",
    paragraphs: [
      "When urgency outruns understanding, assumptions fill the gaps, responsibilities blur, and questions of authority, timing, and readiness surface only after movement has begun.",
      "The Chamber creates a better sequence:",
      "Clarity before pressure. Understanding before assumption. Alignment before obligation. Conditions before movement.",
      "The aim is not to slow the work, but to let the collective move coherently when action begins.",
    ],
  },
] as const;

export function renderGlobalMotherChamberOrientationEmail(
  input: GlobalMotherChamberOrientationInput,
) {
  const subject = "Introduction & Chamber Orientation";

  const text = [
    "Dear Jacqueline,",
    "",
    "I'm Jamal Ward with French-Ward, Inc. Empress Omaedro spoke very warmly of you and shared that you are the person we should coordinate with through Friends of Farmers for materials intended for her review.",
    "",
    "I wanted to introduce myself directly before anything formal arrives.",
    "",
    "French-Ward is currently preparing the next private Chamber for the Empress and the other participating parties. This work has been developing over the past month through ongoing discussions, review, clarification, and practical consideration around the relationship, the gold pathway, and the broader effort everyone is helping move forward with care and purpose.",
    "",
    "French-Ward serves this process from a custodial and commercial position, drawing on its precious-minerals custodianship, gold-trade relationships, commodity experience, and coordination work in service of the shared undertaking. The Chamber gives the group a clear place to preserve what has already developed, refine what still needs attention, and strengthen alignment before moving further toward agreements and execution.",
    "",
    "You'll be receiving the private Chamber access and accompanying materials for the Empress within the next 24 hours. We understand that you'll receive them, review what is being sent, and make sure they reach her properly.",
    "",
    "I've attached a short Chamber Orientation so you have a clear sense of what is coming, what the Chamber holds, and where it sits in the work already underway.",
    "",
    "Please feel welcome to reply directly to this email at any point if you have questions, concerns, or if anything about the materials or delivery process needs clarification.",
    "",
    "Thank you, Jacqueline. I look forward to connecting with you and working together.",
    "",
    "Warmly,",
    "Jamal James Ward",
    "Chief Strategic Officer",
    "French-Ward, Inc.",
  ].join("\n");

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f1ea;color:#1d2d36;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr><td align="center" style="padding:34px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#fffdf8;border:1px solid #d6d0c3;">
<tr><td style="padding:30px 34px 12px;">
  <p style="margin:0 0 8px;color:#796948;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">French-Ward, Inc.</p>
  <h1 style="margin:0;color:#18313e;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;line-height:1.3;">Introduction &amp; Chamber Orientation</h1>
</td></tr>
<tr><td style="padding:18px 34px 34px;color:#29424f;font-size:14px;line-height:1.72;">
  <p style="margin:0 0 18px;">Dear Jacqueline,</p>
  <p style="margin:0 0 18px;">I'm Jamal Ward with French-Ward, Inc. Empress Omaedro spoke very warmly of you and shared that you are the person we should coordinate with through Friends of Farmers for materials intended for her review.</p>
  <p style="margin:0 0 18px;">I wanted to introduce myself directly before anything formal arrives.</p>
  <p style="margin:0 0 18px;">French-Ward is currently preparing the next private Chamber for the Empress and the other participating parties. This work has been developing over the past month through ongoing discussions, review, clarification, and practical consideration around the relationship, the gold pathway, and the broader effort everyone is helping move forward with care and purpose.</p>
  <p style="margin:0 0 18px;">French-Ward serves this process from a custodial and commercial position, drawing on its precious-minerals custodianship, gold-trade relationships, commodity experience, and coordination work in service of the shared undertaking. The Chamber gives the group a clear place to preserve what has already developed, refine what still needs attention, and strengthen alignment before moving further toward agreements and execution.</p>
  <p style="margin:0 0 18px;">You'll be receiving the private Chamber access and accompanying materials for the Empress within the next 24 hours. We understand that you'll receive them, review what is being sent, and make sure they reach her properly.</p>
  <p style="margin:0 0 18px;">I've attached a short Chamber Orientation so you have a clear sense of what is coming, what the Chamber holds, and where it sits in the work already underway.</p>
  <p style="margin:0 0 18px;">Please feel welcome to reply directly to this email at any point if you have questions, concerns, or if anything about the materials or delivery process needs clarification.</p>
  <p style="margin:0 0 24px;">Thank you, Jacqueline. I look forward to connecting with you and working together.</p>
  <p style="margin:0;">Warmly,<br /><strong>Jamal James Ward</strong><br />Chief Strategic Officer<br />French-Ward, Inc.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    to: input.recipientEmail,
    subject,
    text,
    html,
  };
}

function ascii(value: string) {
  return value
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("–", "-")
    .replaceAll("—", "-");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = ascii(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

export async function buildGlobalMotherChamberOrientationPdf() {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 54;
  const contentWidth = width - margin * 2;
  let y = height - 58;

  const drawLines = (
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
    color = rgb(0.15, 0.22, 0.26),
    indent = 0,
  ) => {
    const lines = wrapText(text, font, size, contentWidth - indent);
    for (const line of lines) {
      if (y < 58) {
        page = pdf.addPage([595.28, 841.89]);
        y = page.getHeight() - 58;
      }
      page.drawText(line, { x: margin + indent, y, size, font, color });
      y -= lineHeight;
    }
  };

  page.drawText("FRENCH-WARD / CHAMBER ORIENTATION", {
    x: margin,
    y,
    size: 8.5,
    font: bold,
    color: rgb(0.48, 0.39, 0.22),
  });
  y -= 25;

  drawLines("Framework of Royal Custodianship, Restoration & Global Trade", serif, 18, 21, rgb(0.08, 0.18, 0.23));
  y -= 4;
  drawLines(
    `${globalMotherV5Definition.reference} / Chamber V2`,
    bold,
    8.5,
    11,
    rgb(0.38, 0.46, 0.50),
  );
  y -= 18;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.6,
    color: rgb(0.78, 0.76, 0.70),
  });
  y -= 20;

  for (const section of orientationSections) {
    drawLines(section.heading.toUpperCase(), bold, 8.5, 11, rgb(0.45, 0.36, 0.19));
    y -= 5;

    for (const paragraph of section.paragraphs) {
      drawLines(paragraph, regular, 9.5, 13.5);
      y -= 7;
    }

    y -= 5;
  }

  drawLines("French-Ward Administration", serifBold, 9.5, 12, rgb(0.18, 0.27, 0.31));

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

export async function sendGlobalMotherChamberOrientation(
  input: GlobalMotherChamberOrientationInput,
) {
  const mode = getDigitalSettlementEmailMode();
  const from = getDigitalSettlementSender();
  const rendered = renderGlobalMotherChamberOrientationEmail(input);
  const successfulStatus = mode === "send" ? "SENT" : "LOGGED_ONLY";

  const existing = await prisma.emailLog.findFirst({
    where: {
      type: GLOBAL_MOTHER_ORIENTATION_DELIVERY_KEY,
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
    instrumentReference: globalMotherV5Definition.reference,
    chamberCycle: globalMotherV5Definition.cycleLabel,
    communication: "PRE_CHAMBER_ORIENTATION",
    recipientName: "Jacqueline Dwyer",
    representedOrganization: "Friends of Farmers",
    intendedPrincipal: "Empress Omaedro",
    privateCredentialIncluded: false,
  };

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type: GLOBAL_MOTHER_ORIENTATION_DELIVERY_KEY,
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
      type: GLOBAL_MOTHER_ORIENTATION_DELIVERY_KEY,
      from,
      to: input.recipientEmail,
      subject: rendered.subject,
      status: error ? "FAILED" : "SENT",
      messageId,
      rawPayload: {
        ...safePayload,
        response,
        error,
        attachment:
          "Chamber-Orientation-GM-KENYA-RCF-001-Chamber-V2.pdf",
      },
    },
  });

  if (error) {
    throw new Error(
      `[GM_CHAMBER_ORIENTATION_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true as const,
    mode: "send" as const,
    alreadyDelivered: false,
    messageId,
  };
}
