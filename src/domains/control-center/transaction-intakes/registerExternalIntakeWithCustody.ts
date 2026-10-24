import { createHash } from "node:crypto";

import {
  prepareExternalIntakeRegistration,
} from "./externalIntakeRegistration";

import {
  preserveExternalIntakeEvidence,
  type ExternalEvidenceStore,
} from "./preserveExternalIntakeEvidence";

import {
  registerExternalIntakeWithClient,
} from "./registerExternalIntakeWithClient";

type RegistrationInput =
  Parameters<typeof registerExternalIntakeWithClient>[1];

type RegistrationReceipt =
  Awaited<ReturnType<typeof registerExternalIntakeWithClient>>;

type Principal = Readonly<{
  userId: string;
  email: string;
  roles: readonly string[];
  permissions: readonly string[];
}>;

export type ExternalIntakeCommandInput =
  Omit<
    RegistrationInput,
    | "operatorUserId"
    | "sourceEvidenceReference"
    | "sourceEvidenceSha256"
    | "evidenceBytes"
  > & {
    evidenceBytes: Uint8Array;
  };

export const EXTERNAL_INTAKE_CONFIRMATION =
  "REGISTER EXTERNAL INTAKE" as const;

export async function registerExternalIntakeWithCustody(input: {
  principal: Principal | null;
  confirmation: string;
  registration: ExternalIntakeCommandInput;
  store: ExternalEvidenceStore;
  register: (
    registration: RegistrationInput,
  ) => Promise<RegistrationReceipt>;
}) {
  const {
    principal,
    confirmation,
    registration,
    store,
    register,
  } = input;

  if (
    !principal?.userId ||
    !principal.email ||
    !principal.roles.includes("ADMIN_PLATFORM") ||
    !principal.permissions.includes("ADMIN_SURFACE_ACCESS")
  ) {
    throw new Error("FW_TXN_OPERATOR_AUTHORITY_REQUIRED");
  }

  if (confirmation !== EXTERNAL_INTAKE_CONFIRMATION) {
    throw new Error("FW_TXN_EXPLICIT_CONFIRMATION_REQUIRED");
  }

  const bytes = registration.evidenceBytes;

  if (
    !(bytes instanceof Uint8Array) ||
    bytes.byteLength < 5 ||
    bytes.byteLength > 25_000_000
  ) {
    throw new Error("FW_TXN_EVIDENCE_BYTES_INVALID");
  }

  const sha256 = createHash("sha256")
    .update(bytes)
    .digest("hex");

  // Validate declarations before any external storage write.
  // This is not an authenticated buyer submission.
  prepareExternalIntakeRegistration({
    ...registration,
    operatorEmail: principal.email,
    sourceEvidenceReference: `pending-custody/${sha256}`,
    sourceEvidenceSha256: sha256,
  });

  const custody = await preserveExternalIntakeEvidence({
    store,
    bytes,
    expectedSha256: sha256,
  });

  // No caller-provided custody reference can reach persistence.
  // Persisted User.isAdmin is independently verified by
  // registerExternalIntakeWithClient.
  const receipt = await register({
    ...registration,
    operatorUserId: principal.userId,
    evidenceBytes: bytes,
    sourceEvidenceReference: custody.reference,
    sourceEvidenceSha256: custody.sha256,
  });

  return {
    receipt,
    custody,
  };
}
