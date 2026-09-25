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

/** A versioned private attachment. Metadata is not proof of publication. */
export type TransactionDocumentRecord = Readonly<{
  transactionReference: string;
  documentKind: "SPA" | "COMMERCIAL_SCHEDULE";
  documentReference: string;
  version: number;
  fileName: string;
  mimeType: "application/pdf";
  storageAuthority: string;
  storageKey: string;
  sha256: string;
  status: "DRAFT" | "ISSUED" | "EXECUTED" | "SUPERSEDED";
  issuedAt: Date | null;
  executedAt: Date | null;
  uploadedBy: string;
}>;

type StoredTransactionDocumentRecord = Omit<
  TransactionDocumentRecord,
  "issuedAt" | "executedAt"
> & {
  schemaVersion: 1;
  issuedAt: string | null;
  executedAt: string | null;
};

/** Only a durable private provider may implement this contract in production. */
export interface PrivateTransactionDocumentStore {
  read(storageKey: string): Promise<Uint8Array>;
  write(storageKey: string, pdf: Uint8Array): Promise<void>;
}

const DOCUMENTS = {
  SPA: {
    reference: INDERAKSH_SPA_REFERENCE,
    fileName: "SPA-FWI-IGR-AU-2026-017.pdf",
  },
  COMMERCIAL_SCHEDULE: {
    reference: INDERAKSH_COMMERCIAL_SCHEDULE_REFERENCE,
    fileName: "CP-FWI-IGR-AU-2026-017.pdf",
  },
} as const;

function assertSupportedTransaction(transactionReference: string) {
  if (transactionReference !== INDERAKSH_TRANSACTION_REFERENCE) {
    throw new Error("TRANSACTION_DOCUMENT_REFERENCE_NOT_SUPPORTED");
  }
}

function recordKey(
  transactionReference: string,
  kind: TransactionDocumentRecord["documentKind"],
) {
  return `transactions/${transactionReference}/documents/${kind}/current.json`;
}

function issuedPdfKey(
  transactionReference: string,
  kind: TransactionDocumentRecord["documentKind"],
) {
  const document = DOCUMENTS[kind];

  return `transactions/${transactionReference}/issued/${document.fileName}`;
}

function parseStoredRecord(
  bytes: Uint8Array,
): TransactionDocumentRecord {
  const raw = JSON.parse(new TextDecoder().decode(bytes)) as StoredTransactionDocumentRecord;

  if (
    raw.schemaVersion !== 1 ||
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
  kind: TransactionDocumentRecord["documentKind"],
): Promise<TransactionDocumentRecord | null> {
  assertSupportedTransaction(transactionReference);

  const storage = createNeonObjectStorage();

  if (!storage) {
    return null;
  }

  const bytes = await storage.readIfExists(recordKey(transactionReference, kind));

  if (!bytes) {
    return null;
  }

  const record = parseStoredRecord(bytes);

  if (
    record.transactionReference !== transactionReference ||
    record.documentKind !== kind ||
    record.documentReference !== DOCUMENTS[kind].reference ||
    record.fileName !== DOCUMENTS[kind].fileName
  ) {
    throw new Error("TRANSACTION_DOCUMENT_RECORD_AUTHORITY_MISMATCH");
  }

  return record;
}

export async function publishIssuedTransactionDocument(input: {
  transactionReference: string;
  documentKind: TransactionDocumentRecord["documentKind"];
  pdf: Uint8Array;
  uploadedBy: string;
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

  if (existing) {
    if (existing.sha256 === sha256 && existing.status === "ISSUED") {
      return existing;
    }

    throw new Error("TRANSACTION_DOCUMENT_ISSUED_COPY_ALREADY_EXISTS");
  }

  const document = DOCUMENTS[input.documentKind];
  const storageKey = issuedPdfKey(
    input.transactionReference,
    input.documentKind,
  );
  const issuedAt = new Date();

  const record: TransactionDocumentRecord = {
    transactionReference: input.transactionReference,
    documentKind: input.documentKind,
    documentReference: document.reference,
    version: 1,
    fileName: document.fileName,
    mimeType: "application/pdf",
    storageAuthority: `neon-object-storage:${config.bucket}`,
    storageKey,
    sha256,
    status: "ISSUED",
    issuedAt,
    executedAt: null,
    uploadedBy: input.uploadedBy,
  };

  // Object bytes are written first. The manifest is the publication boundary:
  // an orphaned object is not an issued transaction document.
  await storage.write(storageKey, input.pdf, "application/pdf");

  const stored: StoredTransactionDocumentRecord = {
    ...record,
    schemaVersion: 1,
    issuedAt: issuedAt.toISOString(),
    executedAt: null,
  };

  await storage.write(
    recordKey(input.transactionReference, input.documentKind),
    new TextEncoder().encode(JSON.stringify(stored, null, 2)),
    "application/json",
  );

  return record;
}
