import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

import { globalMotherV5Definition } from "../definitions/globalMotherV5Definition";

const sections = [
  {
    heading: "Purpose",
    paragraphs: [
      "This orientation accompanies your continuation from Chamber V1 into Chamber V2. Having navigated the first Chamber, you are receiving it as a courtesy to bring greater clarity, continuity, and refinement to your participation in the next cycle.",
    ],
  },
  {
    heading: "Continuity from Chamber V1",
    paragraphs: [
      "Chamber V1 remains preserved as the first formal cycle of deliberation. Your recorded positions, subsequent communication, and the follow-up questions arising from that cycle remain part of the institutional record.",
      "Chamber V2 is not a restart. It is the matured continuation of that work, incorporating the clarifications, practical developments, and institutional questions that emerged after the first review.",
    ],
  },
  {
    heading: "Your Participation",
    paragraphs: [
      "AOTG's standing and the Bridge role expressed through your participation remain preserved within the Framework.",
      "The Chamber is a protected deliberative environment for clarification, refinement, objection, revision, alignment, and harmony. Participation is therefore most useful when questions and differences are entered directly for consideration rather than framed adversarially.",
      "Where the Chamber issues follow-up questions, direct response helps strengthen the record and allows the next version of the Framework to reflect your position accurately.",
    ],
  },
  {
    heading: "Commercial Sequence",
    paragraphs: [
      "The refinery is already understood as a principal operational requirement of the collective undertaking. Refinery identity, assay, custody, title protection, acceptance procedures, settlement, release instructions, and related obligations belong in the appropriate commercial layer once the relevant refinery, jurisdiction, authorities, institutions, and transaction are known.",
      "The refinery horizon has broadened beyond the initially expressed European focus. A Zimbabwe refinery pathway is among the relationships already introduced and under active consideration, alongside other refinery relationships being developed.",
    ],
  },
  {
    heading: "French-Ward's Role",
    paragraphs: [
      "French-Ward, Inc. serves from a custodial and commercial position: preserving the Framework and its record, organizing collective input, and helping connect shared understanding to practical commercial readiness.",
    ],
  },
  {
    heading: "Chamber V2",
    paragraphs: [
      "Your prior positions remain preserved and will continue to inform the next cycle. Updated private Chamber V2 access will follow separately within 48 hours.",
      "The objective is a clearer shared foundation from which agreements, refinery coordination, commercial structures, and execution can proceed in proper sequence.",
    ],
  },
] as const;

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

export async function buildGlobalMotherKhanKhanOrientationPdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const width = page.getWidth();
  const height = page.getHeight();
  const margin = 48;
  const contentWidth = width - margin * 2;
  let y = height - 50;

  const drawLines = (
    text: string,
    font: PDFFont,
    size: number,
    lineHeight: number,
    color = rgb(0.15, 0.22, 0.26),
  ) => {
    const lines = wrapText(text, font, size, contentWidth);
    for (const line of lines) {
      if (y < 44) {
        throw new Error("KHAN_KHAN_ORIENTATION_OVERFLOW");
      }
      page.drawText(line, { x: margin, y, size, font, color });
      y -= lineHeight;
    }
  };

  page.drawText("FRENCH-WARD / CHAMBER ORIENTATION", {
    x: margin,
    y,
    size: 8.2,
    font: bold,
    color: rgb(0.48, 0.39, 0.22),
  });
  y -= 21;

  drawLines(
    "Framework of Royal Custodianship, Restoration & Global Trade",
    serif,
    17.2,
    19.2,
    rgb(0.08, 0.18, 0.23),
  );
  y -= 3;

  drawLines(
    `${globalMotherV5Definition.reference} / Chamber V2 / Prepared for Imperial Khan-Khan`,
    bold,
    8.1,
    10.2,
    rgb(0.38, 0.46, 0.5),
  );
  y -= 14;

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.6,
    color: rgb(0.78, 0.76, 0.7),
  });
  y -= 15;

  for (const section of sections) {
    drawLines(
      section.heading.toUpperCase(),
      bold,
      8.1,
      10.2,
      rgb(0.45, 0.36, 0.19),
    );
    y -= 3;

    for (const paragraph of section.paragraphs) {
      drawLines(paragraph, regular, 9.0, 12.0);
      y -= 4;
    }

    y -= 3;
  }

  y -= 1;
  drawLines(
    "French-Ward Administration",
    serifBold,
    9.2,
    11,
    rgb(0.18, 0.27, 0.31),
  );

  return Buffer.from(await pdf.save());
}
