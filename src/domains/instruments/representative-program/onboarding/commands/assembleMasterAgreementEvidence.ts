import { createHash } from "node:crypto";

export type PrivateAgreementEvidenceStore = Readonly<{
  putPrivate(input: {
    key: string;
    bytes: Uint8Array;
    contentType: "application/pdf";
    sha256: string;
  }): Promise<{ uri: string; access: string }>;
}>;

const receiptBrand: unique symbol = Symbol("master-agreement-evidence-receipt");

export type MasterAgreementEvidenceReceipt = Readonly<{
  reference: string;
  signerEmail: string;
  adobeAgreementId: string;
  completedAt: Date;
  reviewedByUserId: string;
  reviewedAt: Date;
  signedDocument: Readonly<{ uri: string; contentHash: string }>;
  auditTrail: Readonly<{ uri: string; contentHash: string }>;
  [receiptBrand]: true;
}>;

function requirePdf(bytes: Uint8Array, label: string): void {
  if (
    bytes.length < 5 ||
    bytes[0] !== 0x25 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x44 ||
    bytes[3] !== 0x46 ||
    bytes[4] !== 0x2d
  ) {
    throw new Error(`[ARP_MASTER_AGREEMENT_${label}_PDF_REQUIRED]`);
  }
}

function requirePrivateLocation(
  result: { uri: string; access: string },
  label: string,
): string {
  if (result.access !== "private") {
    throw new Error(`[ARP_MASTER_AGREEMENT_${label}_PRIVATE_STORAGE_REQUIRED]`);
  }

  let location: URL;
  try {
    location = new URL(result.uri);
  } catch {
    throw new Error(`[ARP_MASTER_AGREEMENT_${label}_LOCATION_INVALID]`);
  }

  if (
    !["https:", "s3:"].includes(location.protocol) ||
    !location.hostname ||
    !location.pathname ||
    location.search ||
    location.hash ||
    location.username ||
    location.password
  ) {
    throw new Error(`[ARP_MASTER_AGREEMENT_${label}_LOCATION_INVALID]`);
  }

  return result.uri;
}

/**
 * An operator-reviewed Acrobat execution package, stored privately.
 * The review attestation is human evidence, not cryptographic signature verification.
 */
export async function assembleMasterAgreementEvidence(input: {
  store: PrivateAgreementEvidenceStore;
  reference: string;
  signerEmail: string;
  adobeAgreementId: string;
  completedAt: Date;
  reviewedByUserId: string;
  reviewedAt: Date;
  operatorConfirmedAllSignatures: boolean;
  signedPdf: Uint8Array;
  auditPdf: Uint8Array;
}): Promise<MasterAgreementEvidenceReceipt> {
  const reference = input.reference.trim();
  const signerEmail = input.signerEmail.trim().toLowerCase();
  const adobeAgreementId = input.adobeAgreementId.trim();
  const reviewedByUserId = input.reviewedByUserId.trim();

  if (
    !/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(reference) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail) ||
    !adobeAgreementId ||
    !reviewedByUserId ||
    !Number.isFinite(input.completedAt.getTime()) ||
    !Number.isFinite(input.reviewedAt.getTime()) ||
    !input.operatorConfirmedAllSignatures
  ) {
    throw new Error("[ARP_MASTER_AGREEMENT_EXECUTION_REVIEW_REQUIRED]");
  }

  const signedPdf = Uint8Array.from(input.signedPdf);
  const auditPdf = Uint8Array.from(input.auditPdf);
  const completedAt = new Date(input.completedAt.getTime());
  const reviewedAt = new Date(input.reviewedAt.getTime());

  if (completedAt.getTime() > reviewedAt.getTime()) {
    throw new Error("[ARP_MASTER_AGREEMENT_REVIEW_PRECEDES_COMPLETION]");
  }

  requirePdf(signedPdf, "SIGNED_DOCUMENT");
  requirePdf(auditPdf, "AUDIT_TRAIL");

  const documentHash = createHash("sha256")
    .update(signedPdf)
    .digest("hex");
  const auditHash = createHash("sha256")
    .update(auditPdf)
    .digest("hex");
  if (documentHash === auditHash) {
    throw new Error("[ARP_MASTER_AGREEMENT_DISTINCT_AUDIT_REQUIRED]");
  }

  const prefix = `arp/master-agreements/${reference}`;

  const documentLocation = requirePrivateLocation(
    await input.store.putPrivate({
      key: `${prefix}/signed-${documentHash}.pdf`,
      bytes: signedPdf,
      contentType: "application/pdf",
      sha256: documentHash,
    }),
    "SIGNED_DOCUMENT",
  );

  const auditLocation = requirePrivateLocation(
    await input.store.putPrivate({
      key: `${prefix}/audit-${auditHash}.pdf`,
      bytes: auditPdf,
      contentType: "application/pdf",
      sha256: auditHash,
    }),
    "AUDIT_TRAIL",
  );

  return {
    reference,
    signerEmail,
    adobeAgreementId,
    completedAt,
    reviewedByUserId,
    reviewedAt,
    signedDocument: {
      uri: documentLocation,
      contentHash: documentHash,
    },
    auditTrail: {
      uri: auditLocation,
      contentHash: auditHash,
    },
    [receiptBrand]: true,
  };
}

export function isMasterAgreementEvidenceReceipt(
  value: unknown,
): value is MasterAgreementEvidenceReceipt {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as Record<symbol, unknown>)[receiptBrand] === true
  );
}
