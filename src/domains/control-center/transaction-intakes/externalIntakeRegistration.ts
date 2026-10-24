/**
 * FW-TXN-1A
 * Operator registration contract for externally received intake.
 *
 * This module is pure.
 * It does not access Prisma, issue authority, or send messages.
 */

export type ExternalIntakeRegistrationInput = {
  operationalReference: string;
  operatorEmail: string;

  source: "EXTERNAL_EMAIL";
  sourceEvidenceReference: string;
  sourceEvidenceSha256: string;

  submitterName: string;
  submitterEmail: string;
  submitterRole: string;

  buyerName: string;
  commodity: string;
  trialQuantity: string;
  monthlyQuantity: string;
  destination: string;

  originatingCandidateName: string;
  deliveryTerms: string;
  settlementMethod: string;
};

function required(value: string, field: string): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new Error(`FW_TXN_REQUIRED:${field}`);
  }

  return cleaned;
}

function requireEmail(value: string, field: string): string {
  const cleaned = required(value, field);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    throw new Error(`FW_TXN_INVALID_EMAIL:${field}`);
  }

  return cleaned;
}

export function prepareExternalIntakeRegistration(
  input: ExternalIntakeRegistrationInput,
) {
  const operatorEmail = requireEmail(
    input.operatorEmail,
    "operatorEmail",
  );

  const submitterEmail = requireEmail(
    input.submitterEmail,
    "submitterEmail",
  );

  const sha256 = required(
    input.sourceEvidenceSha256,
    "sourceEvidenceSha256",
  ).toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    throw new Error("FW_TXN_INVALID_EVIDENCE_HASH");
  }

  if (input.source !== "EXTERNAL_EMAIL") {
    throw new Error("FW_TXN_INVALID_SOURCE");
  }

  return {
    operationalReference: required(
      input.operationalReference,
      "operationalReference",
    ),
    operatorEmail,

    provenance: {
      source: input.source,
      evidenceReference: required(
        input.sourceEvidenceReference,
        "sourceEvidenceReference",
      ),
      evidenceSha256: sha256,
      registrationMode: "OPERATOR_EXTERNAL_IMPORT" as const,
    },

    intake: {
      status: "SUBMITTED" as const,
      submitterName: required(
        input.submitterName,
        "submitterName",
      ),
      submitterEmail,
      submitterRole: required(
        input.submitterRole,
        "submitterRole",
      ),

      buyerName: required(input.buyerName, "buyerName"),
      commodity: required(input.commodity, "commodity"),
      trialQuantity: required(
        input.trialQuantity,
        "trialQuantity",
      ),
      monthlyQuantity: required(
        input.monthlyQuantity,
        "monthlyQuantity",
      ),
      destination: required(
        input.destination,
        "destination",
      ),
      deliveryTerms: required(
        input.deliveryTerms,
        "deliveryTerms",
      ),
      settlementMethod: required(
        input.settlementMethod,
        "settlementMethod",
      ),

      referredByName: required(
        input.originatingCandidateName,
        "originatingCandidateName",
      ),
      referredByRole: "ARP_CANDIDATE_ORIGINATOR",
      referralConfirmed: false,

      authorityToRepresent: false,
      authorityToNegotiate: false,
      authorityToSign: false,

      declarationAccuracy: false,
      declarationNoObligation: false,
      declarationNoCommission: false,
    },

    effects: {
      databaseMutation: false,
      buyerNotification: false,
      internalNotification: false,
      opportunityPromotion: false,
      representativeAuthorityGrant: false,
      settlementInstruction: false,
    },
  };
}
