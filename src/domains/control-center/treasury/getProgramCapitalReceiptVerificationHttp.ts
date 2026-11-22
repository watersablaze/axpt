import type {
  PrismaClient,
  TransactionClient,
} from "@prisma/client";

import type {
  CapitalReceiptEvidence,
} from "../../treasury/gateway/capital-receipts/contracts";

import {
  loadProgramCapitalReceiptVerificationPerceptionWithClient,
  type ProgramCapitalReceiptVerificationPerception,
} from "../../treasury/gateway/capital-receipts/application/loadProgramCapitalReceiptVerificationPerceptionWithClient";

import type {
  ProgramCapitalReceiptId,
} from "../../treasury/gateway/shared/identifiers";

export const PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE = {
  INVALID_REQUEST:
    "INVALID_REQUEST",

  NOT_FOUND:
    "NOT_FOUND",

  READY:
    "READY",

  INTEGRITY_FAILURE:
    "INTEGRITY_FAILURE",

  UNAUTHENTICATED:
    "UNAUTHENTICATED",

  PERMISSION_DENIED:
    "PERMISSION_DENIED",
} as const;

export type ProgramCapitalReceiptVerificationHttpState =
  (typeof PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE)[
    keyof typeof PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE
  ];

type LoadVerificationPerception =
  (
    params: {
      receiptId:
        ProgramCapitalReceiptId;

      client:
        TransactionClient;
    },
  ) => Promise<
    ProgramCapitalReceiptVerificationPerception | null
  >;

type ControlCenterMoney =
  Readonly<{
    amount:
      string;

    currency:
      string;
  }>;

type ControlCenterCapitalReceiptEvidence =
  Readonly<{
    id:
      string;

    receiptId:
      string;

    evidenceType:
      string;

    artifactId:
      string;

    externalReference:
      string | null;

    submittedByActorId:
      string;

    recordedAt:
      string;
  }>;

type ControlCenterProgramCapitalReceiptVerification =
  Readonly<{
    receipt:
      Readonly<{
        id:
          string;

        reference:
          string;

        programId:
          string;

        destinationProgramAccountId:
          string;

        receivedFromPartyId:
          string | null;

        declaredAmount:
          ControlCenterMoney;

        verifiedAmount:
          ControlCenterMoney | null;

        recognizedAmount:
          ControlCenterMoney | null;

        receiptMethod:
          string;

        externalReference:
          string | null;

        status:
          string;

        expectedAt:
          string | null;

        receivedAt:
          string | null;

        verifiedAt:
          string | null;

        recognizedAt:
          string | null;

        version:
          number;

        createdAt:
          string;

        updatedAt:
          string;

        createdByActorId:
          string;

        lastModifiedByActorId:
          string;
      }>;

    admittedEvidence:
      readonly ControlCenterCapitalReceiptEvidence[];

    verificationEvent:
      Readonly<{
        eventId:
          string;

        sequence:
          string;

        aggregateVersion:
          number;

        actorId:
          string | null;

        authorityGrantId:
          string | null;

        correlationId:
          string;

        causationId:
          string | null;

        verifiedAmount:
          ControlCenterMoney;

        selectedEvidenceIds:
          readonly string[];

        verifiedAt:
          string;

        occurredAt:
          string;

        recordedAt:
          string;

        previousEventHash:
          string | null;

        eventHash:
          string | null;
      }> | null;

    selectedEvidenceIds:
      readonly string[];

    selectedEvidence:
      readonly ControlCenterCapitalReceiptEvidence[];

    unselectedAdmittedEvidence:
      readonly ControlCenterCapitalReceiptEvidence[];

    loadedAt:
      string;
  }>;

export type GetProgramCapitalReceiptVerificationHttpResult =
  | Readonly<{
      status:
        200;

      body:
        Readonly<{
          ok:
            true;

          state:
            typeof PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.READY;

          perception:
            ControlCenterProgramCapitalReceiptVerification;
        }>;
    }>
  | Readonly<{
      status:
        400 | 404 | 500;

      body:
        Readonly<{
          ok:
            false;

          state:
            ProgramCapitalReceiptVerificationHttpState;

          error:
            string;
        }>;
    }>;

function toControlCenterEvidence(
  evidence:
    CapitalReceiptEvidence,
): ControlCenterCapitalReceiptEvidence {
  return {
    id:
      evidence.id,

    receiptId:
      evidence.receiptId,

    evidenceType:
      evidence.evidenceType,

    artifactId:
      evidence.artifactId,

    externalReference:
      evidence.externalReference ??
      null,

    submittedByActorId:
      evidence.submittedByActorId,

    recordedAt:
      evidence.recordedAt.toISOString(),
  };
}

function toControlCenterVerificationPerception(
  perception:
    ProgramCapitalReceiptVerificationPerception,
): ControlCenterProgramCapitalReceiptVerification {
  const receipt =
    perception.receipt;

  const verificationEvent =
    perception.verificationEvent;

  return {
    receipt: {
      id:
        receipt.id,

      reference:
        receipt.reference,

      programId:
        receipt.programId,

      destinationProgramAccountId:
        receipt.destinationProgramAccountId,

      receivedFromPartyId:
        receipt.receivedFromPartyId ??
        null,

      declaredAmount: {
        ...receipt.declaredAmount,
      },

      verifiedAmount:
        receipt.verifiedAmount
          ? {
              ...receipt.verifiedAmount,
            }
          : null,

      recognizedAmount:
        receipt.recognizedAmount
          ? {
              ...receipt.recognizedAmount,
            }
          : null,

      receiptMethod:
        receipt.receiptMethod,

      externalReference:
        receipt.externalReference ??
        null,

      status:
        receipt.status,

      expectedAt:
        receipt.expectedAt
          ?.toISOString() ??
        null,

      receivedAt:
        receipt.receivedAt
          ?.toISOString() ??
        null,

      verifiedAt:
        receipt.verifiedAt
          ?.toISOString() ??
        null,

      recognizedAt:
        receipt.recognizedAt
          ?.toISOString() ??
        null,

      version:
        receipt.metadata.version,

      createdAt:
        receipt.metadata.createdAt
          .toISOString(),

      updatedAt:
        receipt.metadata.updatedAt
          .toISOString(),

      createdByActorId:
        receipt.metadata.createdByActorId,

      lastModifiedByActorId:
        receipt.metadata.lastModifiedByActorId,
    },

    admittedEvidence:
      perception.admittedEvidence.map(
        toControlCenterEvidence,
      ),

    verificationEvent:
      verificationEvent
        ? {
            eventId:
              verificationEvent.eventId,

            sequence:
              verificationEvent.sequence
                .toString(),

            aggregateVersion:
              verificationEvent.aggregateVersion,

            actorId:
              verificationEvent.actorId ??
              null,

            authorityGrantId:
              verificationEvent.authorityGrantId ??
              null,

            correlationId:
              verificationEvent.correlationId,

            causationId:
              verificationEvent.causationId ??
              null,

            verifiedAmount: {
              ...verificationEvent.verifiedAmount,
            },

            selectedEvidenceIds: [
              ...verificationEvent.selectedEvidenceIds,
            ],

            verifiedAt:
              verificationEvent.verifiedAt
                .toISOString(),

            occurredAt:
              verificationEvent.occurredAt
                .toISOString(),

            recordedAt:
              verificationEvent.recordedAt
                .toISOString(),

            previousEventHash:
              verificationEvent.previousEventHash ??
              null,

            eventHash:
              verificationEvent.eventHash ??
              null,
          }
        : null,

    selectedEvidenceIds: [
      ...perception.selectedEvidenceIds,
    ],

    selectedEvidence:
      perception.selectedEvidence.map(
        toControlCenterEvidence,
      ),

    unselectedAdmittedEvidence:
      perception.unselectedAdmittedEvidence.map(
        toControlCenterEvidence,
      ),

    loadedAt:
      perception.loadedAt.toISOString(),
  };
}

function isVerificationPerceptionIntegrityError(
  error:
    unknown,
): boolean {
  if (
    !(error instanceof Error)
  ) {
    return false;
  }

  return (
    error.message.includes(
      "[TREASURY_GATEWAY_PROGRAM_CAPITAL_RECEIPT_",
    ) ||
    error.message.includes(
      "[TREASURY_GATEWAY_CAPITAL_RECEIPT_EVIDENCE_",
    ) ||
    error.message.includes(
      "[TREASURY_GATEWAY_CAPITAL_RECEIPT_VERIFICATION_",
    )
  );
}

export async function getProgramCapitalReceiptVerificationHttp(
  params: {
    rawReceiptId:
      string;

    prisma:
      PrismaClient;

    loadPerception?:
      LoadVerificationPerception;
  },
): Promise<
  GetProgramCapitalReceiptVerificationHttpResult
> {
  const {
    rawReceiptId,
    prisma,
    loadPerception =
      loadProgramCapitalReceiptVerificationPerceptionWithClient,
  } =
    params;

  const receiptId =
    rawReceiptId.trim();

  if (
    receiptId.length ===
    0
  ) {
    return {
      status:
        400,

      body: {
        ok:
          false,

        state:
          PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.INVALID_REQUEST,

        error:
          "CAPITAL_RECEIPT_ID_REQUIRED",
      },
    };
  }

  let perception:
    ProgramCapitalReceiptVerificationPerception | null;

  try {
    perception =
      await prisma.$transaction(
        (
          tx:
            TransactionClient,
        ) =>
          loadPerception({
            receiptId,

            client:
              tx,
          }),
      );
  } catch (
    error:
      unknown
  ) {
    if (
      isVerificationPerceptionIntegrityError(
        error,
      )
    ) {
      return {
        status:
          500,

        body: {
          ok:
            false,

          state:
            PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.INTEGRITY_FAILURE,

          error:
            "CAPITAL_RECEIPT_VERIFICATION_INTEGRITY_FAILURE",
        },
      };
    }

    throw error;
  }

  if (
    !perception
  ) {
    return {
      status:
        404,

      body: {
        ok:
          false,

        state:
          PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.NOT_FOUND,

        error:
          "CAPITAL_RECEIPT_NOT_FOUND",
      },
    };
  }

  return {
    status:
      200,

    body: {
      ok:
        true,

      state:
        PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.READY,

      perception:
        toControlCenterVerificationPerception(
          perception,
        ),
    },
  };
}
