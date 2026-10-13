import { PDFDocument, StandardFonts, rgb, pushGraphicsState, popGraphicsState, rectangle, clip, endPath } from "pdf-lib";
import { certificateAuthorityTitle, certificateAuthorityConditions } from "./appointmentCertificateAuthorities";
import type { RepresentativeAppointmentCredential } from "./loadRepresentativeAppointmentCredential";

export type AppointmentCredentialExecution = Readonly<{
  signature: Uint8Array;
  seal: Uint8Array;
  issuedAt: Date;
  reviewOnly: boolean;
}>;

function humanize(value: string) {
  return value.toLowerCase().replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function date(value: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}

export async function renderRepresentativeAppointmentCredential(
  record: RepresentativeAppointmentCredential,
  execution?: AppointmentCredentialExecution,
) {
  const pdf = await PDFDocument.create();
  const timestamp = execution?.issuedAt ?? record.generatedAt;
  if (!Number.isFinite(timestamp.getTime())) {
    throw new Error("[ARP_CREDENTIAL_TIME_INVALID]");
  }

  pdf.setTitle("Certificate of Appointment - " + record.displayName);
  pdf.setAuthor("French-Ward, Inc.");
  pdf.setSubject("Appointment record; delegated authority is separately governed");
  pdf.setCreationDate(timestamp);
  pdf.setModificationDate(timestamp);

  const page = pdf.addPage([595.28, 841.89]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.07, 0.13, 0.17);
  const gold = rgb(0.57, 0.45, 0.25);
  const muted = rgb(0.35, 0.40, 0.43);
  const width = 459;
  let y = 768;

  page.drawRectangle({
    x: 32, y: 32, width: 531.28, height: 777.89,
    borderColor: gold, borderWidth: 0.7,
  });
  page.drawRectangle({
    x: 39, y: 39, width: 517.28, height: 763.89,
    borderColor: rgb(0.80, 0.80, 0.76), borderWidth: 0.35,
  });

  function lines(
    value: string,
    font: typeof sans,
    size: number,
    color = ink,
    centered = false,
    leading = size * 1.4,
  ) {
    const wrapped: string[] = [];
    let line = "";
    for (const word of value.split(/\s+/)) {
      if (font.widthOfTextAtSize(word, size) > width) {
        throw new Error("[ARP_CREDENTIAL_TEXT_LAYOUT_UNSUPPORTED]");
      }
      const next = line ? line + " " + word : word;
      if (font.widthOfTextAtSize(next, size) > width) {
        wrapped.push(line);
        line = word;
      } else line = next;
    }
    if (line) wrapped.push(line);

    for (const item of wrapped) {
      if (y < (execution ? 210 : 110)) throw new Error("[ARP_CREDENTIAL_LAYOUT_OVERFLOW]");
      page.drawText(item, {
        x: centered
          ? (595.28 - font.widthOfTextAtSize(item, size)) / 2 : 68,
        y, size, font, color,
      });
      y -= leading;
    }
  }

  if (execution?.reviewOnly) page.drawText("DESIGN SPECIMEN - NOT ISSUED", {
    x: 68, y: 790, size: 8, font: sans, color: gold,
  });
  lines("FRENCH-WARD, INC.", sans, 11, gold, true);
  y -= 5;
  lines("Authorized Representation Program", sans, 9, muted, true);
  y -= 14;
  lines("Certificate of Appointment", serif, 25, ink, true);
  y -= 12;
  lines("French-Ward, Inc. records the appointment of", serif, 12, ink, true);
  y -= 7;
  lines(record.displayName, bold, 23, ink, true);
  y -= 5;
  lines(humanize(record.appointmentClass), serif, 12, gold, true);
  y -= 10;
  page.drawLine({
    start: { x: 68, y }, end: { x: 527, y },
    thickness: 0.6, color: gold,
  });
  y -= 22;


  const particulars = [
    ["Appointment reference", record.reference],
    ["Instrument version", String(record.version)],
    ["Appointment form", humanize(record.appointmentForm)],
    ["Effective date", date(record.effectiveAt) + " (UTC)"],
    ["Expiry", record.expiresAt
      ? date(record.expiresAt) + " (UTC)" : "No expiry recorded"],
  ];

  for (const [label, value] of particulars) {
    const availableWidth = 299;
    const rows: string[] = [];
    let row = "";
    for (const word of value.split(/\s+/)) {
      if (serif.widthOfTextAtSize(word, 10.5) > availableWidth) {
        throw new Error("[ARP_CREDENTIAL_PARTICULARS_OVERFLOW]");
      }
      const next = row ? row + " " + word : word;
      if (serif.widthOfTextAtSize(next, 10.5) > availableWidth) {
        rows.push(row);
        row = word;
      } else row = next;
    }
    if (row) rows.push(row);
    const height = Math.max(22, rows.length * 14 + 7);
    if (y - height < 350) {
      throw new Error("[ARP_CREDENTIAL_PARTICULARS_OVERFLOW]");
    }
    page.drawText(label.toUpperCase(), {
      x: 68, y, font: sans, size: 7, color: muted,
    });
    rows.forEach((item, index) => page.drawText(item, {
      x: 228, y: y - index * 14,
      font: serif, size: 10.5, color: ink,
    }));
    y -= height;
    page.drawLine({
      start: { x: 68, y: y + 9 },
      end: { x: 527, y: y + 9 },
      thickness: 0.3, color: rgb(0.84, 0.85, 0.83),
    });
  }

  y -= 5;
  if (record.authorities?.length) {
    lines("COMMERCIAL MANDATE", sans, 8, gold, false);
    y -= 3;
    const allConditions = record.authorities.map(certificateAuthorityConditions);
    const sharedConditions = [...new Set(allConditions[0])].filter(condition =>
      allConditions.every(conditions => conditions.includes(condition)));
    for (const authority of record.authorities) {
      lines(certificateAuthorityTitle(authority.key), bold, 10, ink, false, 12);
      lines(authority.action, serif, 10, ink, false, 12);
      const conditions = certificateAuthorityConditions(authority).filter(condition => !sharedConditions.includes(condition));
      if (conditions.length) lines(conditions.join(" · "), sans, 7.5, muted, false, 10);
      y -= 6;
    }
    if (sharedConditions.length) {
      lines("COMMON CONDITIONS", sans, 7, gold, false, 10);
      lines(sharedConditions.join(" · "), sans, 7.5, muted, false, 10);
      y -= 4;
    }
    lines("These authorities apply within their recorded scope and conditions. Current standing and authority are confirmed through French-Ward's verification record.",
      sans, 8, muted, false, 11);
  } else {
    lines("This certificate records the appointment identified above. Any delegated authorities are stated in the governing authority record.",
      serif, 10, ink, false, 13);
    y -= 6;
    lines("Current appointment standing is confirmed through French-Ward's verification record.",
      sans, 8, muted, false, 11);
  }

  if (execution) {
    const executionBase = 112;
    if (y < executionBase + 100) throw new Error("[ARP_CREDENTIAL_EXECUTION_LAYOUT_OVERFLOW]");
    if (executionBase < 95) {
      throw new Error("[ARP_CREDENTIAL_EXECUTION_LAYOUT_OVERFLOW]");
    }
    const signature = await pdf.embedPng(execution.signature);
    const seal = await pdf.embedPng(execution.seal);

    // The verified signature asset has a large transparent perimeter.
    // Clip its original pixels in PDF coordinates; do not alter the signed asset.
    if (signature.width === 2032 && signature.height === 1524) {
      const scale = 175 / 1222;
      page.pushOperators(pushGraphicsState(), rectangle(68, executionBase + 53, 175, 58), clip(), endPath());
      page.drawImage(signature, {
        x: 68 - 384 * scale,
        y: executionBase + 53 - (1524 - 903) * scale,
        width: signature.width * scale, height: signature.height * scale,
      });
      page.pushOperators(popGraphicsState());
    } else {
      const scale = Math.min(175 / signature.width, 58 / signature.height);
      page.drawImage(signature, { x: 68, y: executionBase + 53,
        width: signature.width * scale, height: signature.height * scale });
    }

    const sealScale = Math.min(72 / seal.width, 72 / seal.height);
    page.drawImage(seal, {
      x: 442, y: executionBase + 28,
      width: seal.width * sealScale,
      height: seal.height * sealScale,
    });

    page.drawLine({
      start: { x: 68, y: executionBase + 46 }, end: { x: 290, y: executionBase + 46 },
      thickness: 0.4, color: gold,
    });
    page.drawText("Jamal James Ward", {
      x: 68, y: executionBase + 29, size: 11, font: bold, color: ink,
    });
    page.drawText("President & Chief Strategic Officer", {
      x: 68, y: executionBase + 13, size: 8, font: sans, color: muted,
    });
    page.drawText("French-Ward, Inc.", {
      x: 68, y: executionBase, size: 8, font: sans, color: muted,
    });
  }

  page.drawText(execution?.reviewOnly
    ? "ISSUANCE PREVIEW - NOT ISSUED"
    : execution ? "Issued appointment certificate" : "Recorded appointment copy", {
    x: 68, y: 76, font: sans, size: 8, color: gold,
  });
  page.drawText(
    (execution ? "Issue date: " : "Copy generated: ") + timestamp.toISOString(), {
      x: 68, y: 60, font: sans, size: 7, color: muted,
    },
  );

  return pdf.save();
}
