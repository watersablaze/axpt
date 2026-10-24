import "server-only";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { resolveInstitutionalAccessWithClient } from "@/domains/institutional-access/resolveInstitutionalAccessWithClient";
import { getGenericProgramSco } from "@/domains/institutions/french-ward/genericProgramScoVariants";
import { createNeonObjectStorage } from "@/domains/instruments/transaction-documents/neonObjectStorage";
import { readVerifiedGsamArtifact, type GsamArtifactKind } from "@/domains/instruments/transaction-documents/gsamVerifiedArtifact";

/** Frozen Edition 2 artifact bytes. Printed source reference remains 2026-001. */
const EDITIONS = {
  "100-mt": {
    program: "gsam-100-mt",
    reference: "GSAM-SCO-PROGRAM-100MT-2026-002",
    pdf: "9ed96d9421a6913c971aabeb6b4b48df0b6ac5fd05d8d5c1a46c64175904cf6b",
    html: "6d74ac3b817d4bf44bac764abdc1b568a4d842eecfbc52bb20fff5aae2d67037",
    fileStem: "GSAM-Soft-Corporate-Offer-100MT",
  },
  "1000-mt": {
    program: "gsam-1000-mt",
    reference: "GSAM-SCO-PROGRAM-1000MT-2026-002",
    pdf: "d269fa618be345b4d6bd53a9f713a1af9414b5a0b30d958abdd109949bba92be",
    html: "18e30c384aeb8f31cf98656ccaa8a5353fde3907739a568dc0131542f6172993",
    fileStem: "GSAM-Soft-Corporate-Offer-1000MT",
  },
} as const;

export async function getAuthorizedFrozenGsamDocument(
  variant: string,
  kind: GsamArtifactKind,
): Promise<null | Readonly<{ bytes: Uint8Array; contentType: string; fileStem: string }>> {
  if (variant !== "100-mt" && variant !== "1000-mt") return null;
  if (kind !== "pdf" && kind !== "html") return null;
  if (process.env.GSAM_SCO_RECIPIENT_RELEASE !== "enabled" ||
      process.env.GSAM_SCO_FROZEN_EDITION_V2_READY !== "enabled") return null;

  const edition = EDITIONS[variant];
  const principal = await getPrincipal();
  if (!principal?.userId || !principal?.email) return null;
  const program = getGenericProgramSco(edition.program);
  if (!program || program.presenter !== "GROWTHCORP" || program.reference !== edition.reference.replace(/-002$/, "-001")) return null;

  const access = await resolveInstitutionalAccessWithClient({
    client: prisma,
    identity: { userId: principal.userId, email: principal.email },
    scope: "SUPPORTING_DOCUMENT_VIEW",
    action: "VIEW",
    resourceReference: edition.reference,
    resourceVersion: 1,
  });
  if (!access.allowed) return null;

  const registered = await prisma.gsamScoEdition.findUnique({ where: { reference: edition.reference } });
  if (!registered || registered.state !== "CANDIDATE" ||
      registered.quantityMt !== (variant === "100-mt" ? 100 : 1000) ||
      registered.pdfSha256 !== edition.pdf || registered.htmlSha256 !== edition.html) return null;

  const key = kind === "pdf" ? registered.pdfStorageKey : registered.htmlStorageKey;
  if (!key) return null;
  const store = createNeonObjectStorage();
  if (!store) return null;
  // Strict read and SHA-256 verification. No dynamic rendering, source HTML, or public URL fallback.
  const result = await readVerifiedGsamArtifact(store, {
    key,
    sha256: edition[kind],
    kind,
  });
  return { bytes: result.bytes, contentType: result.contentType, fileStem: edition.fileStem };
}


/**
 * Administration-only read of the same frozen edition.
 * Does not use recipient grants or recipient release flags.
 * Does not mutate the registry or document custody.
 */
export async function getAdminFrozenGsamDocument(
  variant: string,
  kind: GsamArtifactKind,
): Promise<null | Readonly<{
  bytes: Uint8Array;
  contentType: string;
  fileStem: string;
}>> {
  const principal = await getPrincipal();
  if (!principal || !isAdmin(principal)) return null;

  if (variant !== "100-mt" && variant !== "1000-mt") return null;
  if (kind !== "pdf" && kind !== "html") return null;

  const edition = EDITIONS[variant];
  const program = getGenericProgramSco(edition.program);

  if (
    !program ||
    program.presenter !== "GROWTHCORP" ||
    program.reference !== edition.reference.replace(/-002$/, "-001")
  ) return null;

  const registered = await prisma.gsamScoEdition.findUnique({
    where: { reference: edition.reference },
  });

  if (
    !registered ||
    registered.state !== "CANDIDATE" ||
    registered.quantityMt !== (variant === "100-mt" ? 100 : 1000) ||
    registered.pdfSha256 !== edition.pdf ||
    registered.htmlSha256 !== edition.html
  ) return null;

  const key = kind === "pdf"
    ? registered.pdfStorageKey
    : registered.htmlStorageKey;

  if (!key) return null;

  const store = createNeonObjectStorage();
  if (!store) return null;

  const result = await readVerifiedGsamArtifact(store, {
    key,
    sha256: edition[kind],
    kind,
  });

  return {
    bytes: result.bytes,
    contentType: result.contentType,
    fileStem: edition.fileStem,
  };
}
