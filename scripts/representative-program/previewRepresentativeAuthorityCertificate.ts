import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { INITIAL_COMMERCIAL_AUTHORITY_PLAN } from
  "../../src/domains/instruments/representative-program/application/appointmentCertificateAuthorities";
import { renderRepresentativeAppointmentCredential } from
  "../../src/domains/instruments/representative-program/application/renderRepresentativeAppointmentCredential";

async function main() {
  const assets = path.join(process.cwd(), "private-assets", "arp");
  const signature = readFileSync(path.join(assets, "jamal-ward-signature.png"));
  const seal = readFileSync(path.join(assets, "french-ward-seal.png"));
  const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(hash(signature), "80169c0c6a46fc165b2999220e9a4cee38e1193d22788deda49c2dfcfe0fbee2");
  assert.equal(hash(seal), "b5387470d30435e040aaae3d59aca784c409dd58a775a9e8c0bf9b1673680bd3");
  const specimenDate = new Date("2026-10-13T00:00:00Z");
  const bytes = await renderRepresentativeAppointmentCredential({
    displayName: "JENS PETER THOMSEN", reference: "FWI-26-RP-001-APPT-001", version: 1,
    appointmentClass: "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    appointmentForm: "INDIVIDUAL_REPRESENTATION", effectiveAt: specimenDate,
    expiresAt: null, generatedAt: specimenDate,
    authorities: INITIAL_COMMERCIAL_AUTHORITY_PLAN.map((entry, index) => ({
      id: "DESIGN-SPECIMEN-" + index,
      key: entry.authorityKey as "ARP.INTRODUCTION" | "ARP.COMMUNICATION" | "ARP.PRESENTATION" | "ARP.COORDINATION",
      action: entry.action, conditions: entry.conditions,
      effectiveAt: specimenDate.toISOString(), expiresAt: null,
    })),
  }, { signature, seal, issuedAt: specimenDate, reviewOnly: true });
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
  const directory = mkdtempSync(path.join(tmpdir(), "arp-authority-certificate-review-"));
  const file = path.join(directory, "Jens-authority-certificate-NOT-ISSUED.pdf");
  writeFileSync(file, bytes);
  console.log("One-page design specimen:", file);
  console.log("Proposed authorities and illustrative dates only. No live records, issuance, upload or mail.");
  if (process.platform === "darwin") {
    execFileSync("open", [file]);
    execFileSync("open", ["-R", file]);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
