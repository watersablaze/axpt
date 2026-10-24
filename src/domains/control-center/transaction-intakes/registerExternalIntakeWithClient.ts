import { createHash, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

import {
  prepareExternalIntakeRegistration,
  type ExternalIntakeRegistrationInput,
} from "./externalIntakeRegistration";

type RegistrationInput = Omit<
  ExternalIntakeRegistrationInput,
  "operatorEmail"
> & {
  operatorUserId: string;
  evidenceBytes: Uint8Array;
};

type TransactionClient = Pick<
  PrismaClient,
  "user" | "transactionIntake" | "transactionIntakeEvent"
>;

type RegistrationClient = Pick<PrismaClient, "$transaction">;

const REGISTRATION_EVENT = "EXTERNAL_INTAKE_REGISTERED";

function assertRequired(value: string, field: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(`FW_TXN_REQUIRED:${field}`);
  }

  return cleaned;
}

function sameHash(left: string, right: string) {
  if (
    !/^[a-f0-9]{64}$/.test(left) ||
    !/^[a-f0-9]{64}$/.test(right)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(left, "hex"),
    Buffer.from(right, "hex"),
  );
}

function registrationReference(
  operationalReference: string,
) {
  const identity = createHash("sha256")
    .update("FW_EXTERNAL_INTAKE_V1\n")
    .update(operationalReference)
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();

  return `AXPT-INT-EXT-${identity}`;
}

export async function registerExternalIntakeWithClient(
  client: RegistrationClient,
  input: RegistrationInput,
) {
  const operatorUserId = assertRequired(
    input.operatorUserId,
    "operatorUserId",
  );

  const evidenceBytes = input.evidenceBytes;

  if (
    !(evidenceBytes instanceof Uint8Array) ||
    evidenceBytes.byteLength === 0 ||
    evidenceBytes.byteLength > 25_000_000
  ) {
    throw new Error("FW_TXN_EVIDENCE_BYTES_INVALID");
  }

  const actualEvidenceHash = createHash("sha256")
    .update(evidenceBytes)
    .digest("hex");

  const declaredEvidenceHash =
    input.sourceEvidenceSha256.trim().toLowerCase();

  if (
    !sameHash(actualEvidenceHash, declaredEvidenceHash)
  ) {
    throw new Error("FW_TXN_EVIDENCE_HASH_MISMATCH");
  }

  const custodyReference = assertRequired(
    input.sourceEvidenceReference,
    "sourceEvidenceReference",
  );

  // Custody reference is asserted by the trusted caller.
  // This service checks evidence bytes, not remote storage durability.
  if (
    custodyReference.startsWith("http:") ||
    custodyReference.startsWith("https:")
  ) {
    throw new Error("FW_TXN_CUSTODY_REFERENCE_UNSAFE");
  }

  return client.$transaction(async (tx: TransactionClient) => {
    const operator = await tx.user.findUnique({
      where: { id: operatorUserId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
      },
    });

    if (!operator?.isAdmin || !operator.email) {
      throw new Error("FW_TXN_OPERATOR_UNAUTHORIZED");
    }

    const prepared = prepareExternalIntakeRegistration({
      ...input,
      operatorEmail: operator.email,
      sourceEvidenceSha256: actualEvidenceHash,
    });

    const reference = registrationReference(
      prepared.operationalReference,
    );

    // Fingerprint the full canonical registration request.
    // Operator identity is audit metadata, not case identity.
    const requestFingerprint = createHash("sha256")
      .update(JSON.stringify({
        operationalReference: prepared.operationalReference,
        provenance: prepared.provenance,
        intake: prepared.intake,
      }))
      .digest("hex");

    const provenance = {
      version: 1,
      requestFingerprint,
      registrationMode: "OPERATOR_EXTERNAL_IMPORT",
      source: "EXTERNAL_EMAIL",
      operationalReference: prepared.operationalReference,
      evidenceReference: custodyReference,
      evidenceSha256: actualEvidenceHash,
      originator: prepared.intake.referredByName,
      operatorUserId: operator.id,
    };

    const existing = await tx.transactionIntake.findUnique({
      where: { reference },
    });

    if (existing) {
      const event = await tx.transactionIntakeEvent.findFirst({
        where: {
          intakeId: existing.id,
          eventType: REGISTRATION_EVENT,
        },
      });

      if (!event?.note) {
        throw new Error("FW_TXN_EXISTING_PROVENANCE_MISSING");
      }

      let recorded: typeof provenance;

      try {
        recorded = JSON.parse(event.note);
      } catch {
        throw new Error("FW_TXN_EXISTING_PROVENANCE_INVALID");
      }

      if (
        recorded.requestFingerprint !== requestFingerprint ||
        recorded.evidenceSha256 !== actualEvidenceHash ||
        recorded.evidenceReference !== custodyReference ||
        recorded.operationalReference !==
          prepared.operationalReference ||
        recorded.originator !==
          prepared.intake.referredByName ||
        existing.submitterEmail !==
          prepared.intake.submitterEmail ||
        existing.buyerName !== prepared.intake.buyerName
      ) {
        throw new Error("FW_TXN_REGISTRATION_CONFLICT");
      }

      return {
        intakeId: existing.id,
        intakeReference: existing.reference,
        status: existing.status,
        alreadyRegistered: true,
        evidenceSha256: actualEvidenceHash,
      };
    }

    const intake = await tx.transactionIntake.create({
      data: {
        reference,
        ...prepared.intake,
        sourceUrl: null,
        ipAddress: null,
        userAgent: null,
        internalNotes:
          `External operator registration. ` +
          `Case: ${prepared.operationalReference}. ` +
          `Evidence: ${custodyReference}. ` +
          `Commercial and representative authority unverified.`,
      },
    });

    await tx.transactionIntakeEvent.create({
      data: {
        intakeId: intake.id,
        eventType: REGISTRATION_EVENT,
        fromStatus: null,
        toStatus: "SUBMITTED",
        actor: operator.email,
        note: JSON.stringify(provenance),
      },
    });

    return {
      intakeId: intake.id,
      intakeReference: intake.reference,
      status: intake.status,
      alreadyRegistered: false,
      evidenceSha256: actualEvidenceHash,
    };
  });
}
