import type {
  PrismaClient,
  TransactionClient,
} from "@prisma/client";

import type {
  Principal,
} from "../../auth/types";

import {
  prepareDigitalSettlementTreasuryReceiptCandidateWithClient,
  type DigitalSettlementTreasuryReceiptCandidateClient,
} from "../../treasury/gateway/capital-receipts/intake/prepareDigitalSettlementTreasuryReceiptCandidateWithClient";

import {
  reportDigitalSettlementRecognitionToTreasuryWithClient,
} from "../../treasury/gateway/capital-receipts/intake/reportDigitalSettlementRecognitionToTreasuryWithClient";

type ParsedTreasuryRouting =
  Readonly<{
    programId:
      string;

    destinationProgramAccountId:
      string;

    authorityGrantId?:
      string;
  }>;

export type ReportDigitalSettlementRecognitionReceiptHttpResult =
  | Readonly<{
      status:
        201 | 200;

      body:
        Readonly<{
          ok:
            true;

          disposition:
            "REPORTED" | "REPLAYED";

          receipt:
            Readonly<{
              id:
                string;

              reference:
                string;

              status:
                string;

              version:
                number;

              programId:
                string;

              destinationProgramAccountId:
                string;

              declaredAmount:
                Readonly<{
                  amount:
                    string;

                  currency:
                    string;
                }>;

              externalReference:
                string | null;

              receivedAt:
                string;

              createdAt:
                string;
            }>;
        }>;
    }>
  | Readonly<{
      status:
        400 | 404 | 409;

      body:
        Readonly<{
          ok:
            false;

          error:
            string;
        }>;
    }>;

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readRequiredString(
  record:
    Record<string, unknown>,

  key:
    string,
): string {
  const value =
    record[key];

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      `[DSI_TREASURY_REPORT_FIELD_REQUIRED] ${key}`,
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length ===
    0
  ) {
    throw new Error(
      `[DSI_TREASURY_REPORT_FIELD_REQUIRED] ${key}`,
    );
  }

  return normalized;
}

function readOptionalString(
  record:
    Record<string, unknown>,

  key:
    string,
): string | undefined {
  const value =
    record[key];

  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      `[DSI_TREASURY_REPORT_FIELD_INVALID] ${key}`,
    );
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : undefined;
}

function parseRouting(
  body:
    unknown,
): ParsedTreasuryRouting {
  if (
    !isRecord(body)
  ) {
    throw new Error(
      "[DSI_TREASURY_REPORT_BODY_REQUIRED]",
    );
  }

  return {
    programId:
      readRequiredString(
        body,
        "programId",
      ),

    destinationProgramAccountId:
      readRequiredString(
        body,
        "destinationProgramAccountId",
      ),

    authorityGrantId:
      readOptionalString(
        body,
        "authorityGrantId",
      ),
  };
}

function isInputError(
  error:
    unknown,
): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith(
      "[DSI_TREASURY_REPORT_",
    )
  );
}

function includesCode(
  error:
    unknown,

  code:
    string,
): boolean {
  return (
    error instanceof Error &&
    error.message.includes(
      code,
    )
  );
}

export async function reportDigitalSettlementRecognitionReceiptHttp(
  params: {
    rawInstrumentReference:
      string;

    request:
      Request;

    principal:
      Principal;

    prisma:
      PrismaClient;

    now?:
      () => Date;
  },
): Promise<
  ReportDigitalSettlementRecognitionReceiptHttpResult
> {
  const {
    request,
    principal,
    prisma,
    now = () => new Date(),
  } = params;

  const instrumentReference =
    params.rawInstrumentReference
      .trim();

  if (
    instrumentReference.length ===
    0
  ) {
    return {
      status:
        400,

      body: {
        ok:
          false,

        error:
          "DSI_REFERENCE_REQUIRED",
      },
    };
  }

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return {
      status:
        400,

      body: {
        ok:
          false,

        error:
          "INVALID_JSON_BODY",
      },
    };
  }

  let routing:
    ParsedTreasuryRouting;

  try {
    routing =
      parseRouting(
        body,
      );
  } catch (
    error:
      unknown
  ) {
    if (
      isInputError(
        error,
      )
    ) {
      return {
        status:
          400,

        body: {
          ok:
            false,

          error:
            error instanceof Error
              ? error.message
              : "INVALID_DSI_TREASURY_REPORT_REQUEST",
        },
      };
    }

    throw error;
  }

  const reportedAt =
    now();

  async function execute() {
    return prisma.$transaction(
      async (
        tx:
          TransactionClient,
      ) => {
        /*
         * Source fact is reconstructed from durable DSI,
         * observation, version, and recognition-event state.
         *
         * Nothing supplied by the browser is trusted as
         * recognition evidence.
         */
        const source =
          await prepareDigitalSettlementTreasuryReceiptCandidateWithClient({
            instrumentReference,

            client:
              tx as TransactionClient &
                DigitalSettlementTreasuryReceiptCandidateClient,
          });

        /*
         * Treasury routing is a distinct operator act.
         *
         * Actor identity is derived exclusively from the
         * authenticated Treasury Principal.
         */
        return reportDigitalSettlementRecognitionToTreasuryWithClient({
          intake: {
            source,

            routing: {
              programId:
                routing.programId,

              destinationProgramAccountId:
                routing.destinationProgramAccountId,

              treasuryActorId:
                principal.userId,

              authorityGrantId:
                routing.authorityGrantId,
            },
          },

          reportedAt,

          client:
            tx,
        });
      },
    );
  }

  let result;

  try {
    result =
      await execute();
  } catch (
    error:
      unknown
  ) {
    if (
      includesCode(
        error,
        "DSI_TREASURY_CANDIDATE_NOT_FOUND",
      )
    ) {
      return {
        status:
          404,

        body: {
          ok:
            false,

          error:
            "DSI_TREASURY_CANDIDATE_NOT_FOUND",
        },
      };
    }

    if (
      includesCode(
        error,
        "DSI_TREASURY_CANDIDATE_RECOGNITION_BINDING_MISSING",
      )
    ) {
      return {
        status:
          409,

        body: {
          ok:
            false,

          error:
            "DSI_TREASURY_RECOGNITION_NOT_READY",
        },
      };
    }

    if (
      includesCode(
        error,
        "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
      ) ||
      includesCode(
        error,
        "TREASURY_GATEWAY_COMMAND_KIND_COLLISION",
      )
    ) {
      return {
        status:
          409,

        body: {
          ok:
            false,

          error:
            "DSI_TREASURY_RECEIPT_IDEMPOTENCY_COLLISION",
        },
      };
    }

    if (
      includesCode(
        error,
        "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT",
      )
    ) {
      try {
        result =
          await execute();
      } catch (
        retryError:
          unknown
      ) {
        if (
          includesCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
          ) ||
          includesCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_KIND_COLLISION",
          )
        ) {
          return {
            status:
              409,

            body: {
              ok:
                false,

              error:
                "DSI_TREASURY_RECEIPT_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    } else {
      throw error;
    }
  }

  const receipt =
    result.report.aggregate;

  return {
    status:
      result.report.disposition ===
      "REPORTED"
        ? 201
        : 200,

    body: {
      ok:
        true,

      disposition:
        result.report.disposition,

      receipt: {
        id:
          receipt.id,

        reference:
          receipt.reference,

        status:
          receipt.status,

        version:
          receipt.metadata.version,

        programId:
          receipt.programId,

        destinationProgramAccountId:
          receipt.destinationProgramAccountId,

        declaredAmount: {
          ...receipt.declaredAmount,
        },

        externalReference:
          receipt.externalReference,

        receivedAt:
          receipt.receivedAt
            .toISOString(),

        createdAt:
          receipt.metadata.createdAt
            .toISOString(),
      },
    },
  };
}
