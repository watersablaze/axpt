import "server-only";

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

/** Only a durable private provider may implement this contract in production. */
export interface PrivateTransactionDocumentStore {
  read(storageKey: string): Promise<Uint8Array>;
  write(storageKey: string, pdf: Uint8Array): Promise<void>;
}

export function privateTransactionDocumentStore(): PrivateTransactionDocumentStore | null {
  // No durable private object storage is configured in the current source.
  // Fail closed until a provider is bound and verified in the deployment.
  return null;
}

export async function loadIssuedTransactionDocument(
  _transactionReference: string,
  _kind: TransactionDocumentRecord["documentKind"],
): Promise<TransactionDocumentRecord | null> {
  // A private, durable metadata catalog must be provisioned with the PDFs.
  // Static display metadata is not an issued attachment authority.
  return null;
}
