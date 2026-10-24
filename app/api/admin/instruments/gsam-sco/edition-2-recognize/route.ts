import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { createNeonObjectStorage } from "@/domains/instruments/transaction-documents/neonObjectStorage";
import { readVerifiedGsamArtifact } from "@/domains/instruments/transaction-documents/gsamVerifiedArtifact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const editions = [
  {
    reference: "GSAM-SCO-PROGRAM-100MT-2026-002",
    quantityMt: 100,
    pdfSha256: "9ed96d9421a6913c971aabeb6b4b48df0b6ac5fd05d8d5c1a46c64175904cf6b",
    htmlSha256: "6d74ac3b817d4bf44bac764abdc1b568a4d842eecfbc52bb20fff5aae2d67037",
  },
  {
    reference: "GSAM-SCO-PROGRAM-1000MT-2026-002",
    quantityMt: 1000,
    pdfSha256: "d269fa618be345b4d6bd53a9f713a1af9414b5a0b30d958abdd109949bba92be",
    htmlSha256: "18e30c384aeb8f31cf98656ccaa8a5353fde3907739a568dc0131542f6172993",
  },
] as const;

const keyFor = (digest: string, kind: string) => `gsam/sco/sha256/${digest}.${kind}`;
const response = (error: string, status: number) =>
  NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

/** Registers verified documentary custody only. This does NOT issue, grant, or deliver an offer. */
export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal?.userId ||
      !principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE))
    return response("OPERATOR_PERMISSION_REQUIRED", 403);

  if (request.headers.get("origin") !== new URL(request.url).origin)
    return response("REQUEST_ORIGIN_MISMATCH", 403);
  if (request.headers.get("x-gsam-confirm") !== "RECOGNIZE GSAM EDITION 2")
    return response("EXPLICIT_CONFIRMATION_REQUIRED", 400);
  if (process.env.GSAM_ED2_REGISTRY_ENABLED !== "enabled")
    return response("GSAM_ED2_REGISTRY_DISABLED", 403);

  // ED2 provenance is the exact frozen staging manifest, not an authoring source.
  // The legacy sourceSha256 column stores the manifest digest for ED2 only.
  const provenanceType = "ED2_ARTIFACT_MANIFEST_SHA256";
  const sourceSha256 = "2335dea5775abb1d76a6d76521ad01036ad19bb58f9aba4a59cc4a224e808ef5";
  if (request.headers.get("x-gsam-provenance-type") !== provenanceType)
    return response("PROVENANCE_TYPE_REQUIRED", 400);
  if (request.headers.get("x-gsam-source-sha256") !== sourceSha256)
    return response("MANIFEST_SHA256_MISMATCH", 400);

  const store = createNeonObjectStorage();
  if (!store) return response("STORAGE_CONFIGURATION_UNAVAILABLE", 503);

  // Independently read all four provider objects before any registry write.
  try {
    for (const edition of editions) {
      for (const kind of ["pdf", "html"] as const) {
        const digest = edition[kind === "pdf" ? "pdfSha256" : "htmlSha256"];
        await readVerifiedGsamArtifact(store, { key: keyFor(digest, kind), sha256: digest, kind });
      }
    }
  } catch {
    return response("PROVIDER_CUSTODY_NOT_VERIFIED", 503);
  }

  try {
    // All-or-nothing DB recognition; repeated identical calls do not append duplicate events.
    const result = await prisma.$transaction(async (tx: Pick<typeof prisma, "gsamScoEdition" | "gsamScoEditionEvent">) => {
      const records = [];
      for (const edition of editions) {
        const pdfStorageKey = keyFor(edition.pdfSha256, "pdf");
        const htmlStorageKey = keyFor(edition.htmlSha256, "html");
        const existing = await tx.gsamScoEdition.findUnique({
          where: { reference: edition.reference },
        });
        if (existing) {
          if (existing.quantityMt !== edition.quantityMt ||
              existing.state !== "CANDIDATE" ||
              existing.sourceSha256 !== sourceSha256 ||
              existing.pdfSha256 !== edition.pdfSha256 ||
              existing.htmlSha256 !== edition.htmlSha256 ||
              existing.pdfStorageKey !== pdfStorageKey ||
              existing.htmlStorageKey !== htmlStorageKey)
            throw new Error("EDITION_REGISTRY_CONFLICT");
          records.push({ reference: edition.reference, disposition: "existing" });
          continue;
        }

        const created = await tx.gsamScoEdition.create({
          data: {
            reference: edition.reference,
            quantityMt: edition.quantityMt,
            state: "CANDIDATE",
            sourceSha256,
            pdfSha256: edition.pdfSha256,
            htmlSha256: edition.htmlSha256,
            pdfStorageKey,
            htmlStorageKey,
          },
        });
        await tx.gsamScoEditionEvent.create({
          data: {
            editionId: created.id,
            eventType: "ED2_VERIFIED_CUSTODY_RECOGNIZED",
            eventDetail: { reference: edition.reference, sourceSha256, provenanceType, authoringSourceSha256: null, pdfStorageKey, htmlStorageKey, operatorUserId: principal.userId },
          },
        });
        records.push({ reference: edition.reference, disposition: "created" });
      }
      return records;
    });

    return NextResponse.json({
      ok: true,
      status: "CANDIDATE_CUSTODY_RECOGNIZED",
      records: result,
      provenanceType,
      recipientGrantsMutated: false,
      emailSent: false,
      issued: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return response("EDITION_REGISTRY_CONFLICT_OR_UNAVAILABLE", 409);
  }
}
