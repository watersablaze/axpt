import "server-only";

import { createHash } from "node:crypto";

import {
  INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
  INDERAKSH_SPA_REFERENCE,
  INDERAKSH_TRANSACTION_REFERENCE,
} from "@/domains/instruments/definitions/inderakshTransactionContinuity";
import {
  createNeonObjectStorage,
  loadNeonObjectStorageConfig,
} from "./neonObjectStorage";

export type TransactionDocumentKind = "SPA" | "COMMERCIAL_SCHEDULE";
export type TransactionDocumentStatus =
  | "DRAFT"
  | "REVIEW"
  | "EXECUTION"
  | "EXECUTED"
  | "SUPERSEDED";

/** A versioned private attachment. Metadata is the governed release authority. */
export type TransactionDocumentRecord = Readonly<{
  transactionReference: string;
  documentKind: TransactionDocumentKind;
  documentReference: string;
  version: number;
  fileName: string;
  mimeType: "application/pdf";
  storageAuthority: string;
  storageKey: string;
  sha256: string;
  status: TransactionDocumentStatus;
  issuedAt: Date | null;
  executedAt: Date | null;
  uploadedBy: string;
}>;

type StoredTransactionDocumentRecord = Omit<
  TransactionDocumentRecord,
  "issuedAt" | "executedAt"
> & {
  schemaVersion: 2;
  issuedAt: string | null;
  executedAt: string | null;
};

export interface PrivateTransactionDocumentStore {
  read(storageKey: string): Promise<Uint8Array>;
  write(storageKey: string, pdf: Uint8Array): Promise<void>;
}

const DOCUMENTS = {
  SPA: {
    reference: INDERAKSH_SPA_REFERENCE,
    baseFileName: "SPA-FWI-IGR-AU-2026-017",
  },
  COMMERCIAL_SCHEDULE: {
    reference: INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
    baseFileName: "CP-FWI-IGR-AU-2026-017",
  },
} as const;

function assertSupportedTransaction(transactionReference: string) {
  if (transactionReference !== INDERAKSH_TRANSACTION_REFERENCE) {
    throw new Error("TRANSACTION_DOCUMENT_REFERENCE_NOT_SUPPORTED");
  }
}

function currentRecordKey(
  transactionReference: string,
  kind: TransactionDocumentKind,
) {
  return `transactions/${transactionReference}/documents/${kind}/current.json`;
}

function versionRecordKey(
  transactionReference: string,
  kind: TransactionDocumentKind,
  version: number,
) {
  return `transactions/${transactionReference}/documents/${kind}/versions/${version}.json`;
}

function fileNameFor(
  kind: TransactionDocumentKind,
  status: "REVIEW" | "EXECUTION" | "EXECUTED",
) {
  const base = DOCUMENTS[kind].baseFileName;

  if (status === "REVIEW") {
    return `${base}-REVIEW.pdf`;
  }

  if (status === "EXECUTED") {
    return `${base}-EXECUTED.pdf`;
  }

  return `${base}.pdf`;
}

function pdfStorageKey(
  transactionReference: string,
  status: "REVIEW" | "EXECUTION" | "EXECUTED",
  fileName: string,
) {
  const folder =
    status === "REVIEW"
      ? "review"
      : status === "EXECUTION"
        ? "execution"
        : "executed";

  return `transactions/${transactionReference}/${folder}/${fileName}`;
}

function parseStoredRecord(
  bytes: Uint8Array,
): TransactionDocumentRecord {
  const raw = JSON.parse(
    new TextDecoder().decode(bytes),
  ) as StoredTransactionDocumentRecord;

  if (
    raw.schemaVersion !== 2 ||
    raw.mimeType !== "application/pdf" ||
    (raw.documentKind !== "SPA" &&
      raw.documentKind !== "COMMERCIAL_SCHEDULE")
  ) {
    throw new Error("TRANSACTION_DOCUMENT_RECORD_INVALID");
  }

  return {
    transactionReference: raw.transactionReference,
    documentKind: raw.documentKind,
    documentReference: raw.documentReference,
    version: raw.version,
    fileName: raw.fileName,
    mimeType: raw.mimeType,
    storageAuthority: raw.storageAuthority,
    storageKey: raw.storageKey,
    sha256: raw.sha256,
    status: raw.status,
    issuedAt: raw.issuedAt ? new Date(raw.issuedAt) : null,
    executedAt: raw.executedAt ? new Date(raw.executedAt) : null,
    uploadedBy: raw.uploadedBy,
  };
}

export function privateTransactionDocumentStore(): PrivateTransactionDocumentStore | null {
  const storage = createNeonObjectStorage();

  if (!storage) {
    return null;
  }

  return {
    read: (storageKey) => storage.read(storageKey),
    write: (storageKey, pdf) =>
      storage.write(storageKey, pdf, "application/pdf"),
  };
}

export async function loadIssuedTransactionDocument(
  transactionReference: string,
  kind: TransactionDocumentKind,
): Promise<TransactionDocumentRecord | null> {
  assertSupportedTransaction(transactionReference);

  const storage = createNeonObjectStorage();

  if (!storage) {
    return null;
  }

  const bytes = await storage.readIfExists(
    currentRecordKey(transactionReference, kind),
  );

  if (!bytes) {
    return null;
  }

  const record = parseStoredRecord(bytes);

  if (
    record.transactionReference !== transactionReference ||
    record.documentKind !== kind ||
    record.documentReference !== DOCUMENTS[kind].reference
  ) {
    throw new Error("TRANSACTION_DOCUMENT_RECORD_AUTHORITY_MISMATCH");
  }

  return record;
}

async function publishTransactionDocument(input: {
  transactionReference: string;
  documentKind: TransactionDocumentKind;
  pdf: Uint8Array;
  uploadedBy: string;
  status: "REVIEW" | "EXECUTION" | "EXECUTED";
}): Promise<TransactionDocumentRecord> {
  assertSupportedTransaction(input.transactionReference);

  const config = loadNeonObjectStorageConfig();
  const storage = createNeonObjectStorage();

  if (!config || !storage) {
    throw new Error("TRANSACTION_DOCUMENT_PRIVATE_STORE_NOT_CONFIGURED");
  }

  const existing = await loadIssuedTransactionDocument(
    input.transactionReference,
    input.documentKind,
  );

  const sha256 = createHash("sha256").update(input.pdf).digest("hex");

  if (existing?.status === input.status) {
    if (existing.sha256 === sha256) {
      return existing;
    }

    throw new Error("TRANSACTION_DOCUMENT_RELEASE_ALREADY_EXISTS");
  }

  if (
    existing &&
    (existing.status === "EXECUTION" ||
      existing.status === "EXECUTED") &&
    input.status === "REVIEW"
  ) {
    throw new Error("TRANSACTION_DOCUMENT_CANNOT_REVERT_TO_REVIEW");
  }

  const version = (existing?.version ?? 0) + 1;
  const document = DOCUMENTS[input.documentKind];
  const fileName = fileNameFor(input.documentKind, input.status);
  const storageKey = pdfStorageKey(
    input.transactionReference,
    input.status,
    fileName,
  );
  const issuedAt = new Date();
  const executedAt =
    input.status === "EXECUTED" ? issuedAt : null;

  const record: TransactionDocumentRecord = {
    transactionReference: input.transactionReference,
    documentKind: input.documentKind,
    documentReference: document.reference,
    version,
    fileName,
    mimeType: "application/pdf",
    storageAuthority: `neon-object-storage:${config.bucket}`,
    storageKey,
    sha256,
    status: input.status,
    issuedAt,
    executedAt,
    uploadedBy: input.uploadedBy,
  };

  // Bytes first; immutable version manifest second; current pointer last.
  // A partial write never silently replaces the current governed authority.
  await storage.write(storageKey, input.pdf, "application/pdf");

  const stored: StoredTransactionDocumentRecord = {
    ...record,
    schemaVersion: 2,
    issuedAt: issuedAt.toISOString(),
    executedAt: executedAt?.toISOString() ?? null,
  };

  const manifest = new TextEncoder().encode(
    JSON.stringify(stored, null, 2),
  );

  await storage.write(
    versionRecordKey(
      input.transactionReference,
      input.documentKind,
      version,
    ),
    manifest,
    "application/json",
  );

  await storage.write(
    currentRecordKey(
      input.transactionReference,
      input.documentKind,
    ),
    manifest,
    "application/json",
  );

  return record;
}

export async function publishReviewTransactionDocument(input: {
  transactionReference: string;
  documentKind: TransactionDocumentKind;
  pdf: Uint8Array;
  uploadedBy: string;
}) {
  return publishTransactionDocument({
    ...input,
    status: "REVIEW",
  });
}
