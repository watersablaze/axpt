import { randomUUID } from "node:crypto";

import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { Principal } from "../../auth/types";

import type { CreateTreasuryTransfer } from "../../treasury/gateway/transfers/commands";

import {
  TREASURY_TRANSFER_LOCATION_KIND,
  type TreasuryTransferLocation,
} from "../../treasury/gateway/transfers/contracts";

import { originateTreasuryTransferIdempotentlyWithClient } from "../../treasury/gateway/transfers/application/originateTreasuryTransferIdempotentlyWithClient";

type OriginationPayload = CreateTreasuryTransfer["payload"];

type ParsedOriginationRequest = Readonly<{
  reference: string;

  payload: OriginationPayload;
}>;

export type ControlCenterTreasuryTransferOriginationHttpResult =
  | Readonly<{
      status: 201 | 200;

      body: Readonly<{
        ok: true;

        disposition: "CREATED" | "REPLAYED";

        transfer: Readonly<{
          id: string;

          reference: string;

          status: string;

          version: number;

          programId: string;

          requestedAmount: Readonly<{
            amount: string;

            currency: string;
          }>;

          destinationCurrency: string;

          purpose: string;

          createdAt: string;
        }>;
      }>;
    }>
  | Readonly<{
      status: 400 | 409;

      body: Readonly<{
        ok: false;

        error: string;
      }>;
    }>;

type IdentityFactory = () => string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(
  record: Record<string, unknown>,

  key: string,
): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`[TREASURY_TRANSFER_ORIGINATION_FIELD_REQUIRED] ${key}`);
  }

  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`[TREASURY_TRANSFER_ORIGINATION_FIELD_REQUIRED] ${key}`);
  }

  return normalized;
}

function readOptionalString(
  record: Record<string, unknown>,

  key: string,
): string | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`[TREASURY_TRANSFER_ORIGINATION_FIELD_INVALID] ${key}`);
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function parseLocation(
  value: unknown,

  fieldName: string,
): TreasuryTransferLocation {
  if (!isRecord(value)) {
    throw new Error(
      `[TREASURY_TRANSFER_ORIGINATION_LOCATION_REQUIRED] ${fieldName}`,
    );
  }

  const kind = readRequiredString(value, "kind");

  switch (kind) {
    case TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT:
      return {
        kind,

        programAccountId: readRequiredString(value, "programAccountId"),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.TREASURY_PARTY:
      return {
        kind,

        treasuryPartyId: readRequiredString(value, "treasuryPartyId"),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.SETTLEMENT_ENDPOINT:
      return {
        kind,

        settlementEndpointId: readRequiredString(value, "settlementEndpointId"),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.EXTERNAL_REFERENCE:
      return {
        kind,

        externalReference: readRequiredString(value, "externalReference"),
      };

    case TREASURY_TRANSFER_LOCATION_KIND.OTHER:
      return {
        kind,

        reference: readRequiredString(value, "reference"),
      };

    default:
      throw new Error(
        `[TREASURY_TRANSFER_ORIGINATION_LOCATION_KIND_INVALID] ${fieldName}:${kind}`,
      );
  }
}

function parseRequestedAmount(
  value: unknown,
): OriginationPayload["requestedAmount"] {
  if (!isRecord(value)) {
    throw new Error("[TREASURY_TRANSFER_ORIGINATION_AMOUNT_REQUIRED]");
  }

  const amount = readRequiredString(value, "amount");

  const currency = readRequiredString(value, "currency");

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("[TREASURY_TRANSFER_ORIGINATION_AMOUNT_INVALID]");
  }

  return {
    amount,

    currency,
  };
}

function parseOriginationRequest(body: unknown): ParsedOriginationRequest {
  if (!isRecord(body)) {
    throw new Error("[TREASURY_TRANSFER_ORIGINATION_BODY_REQUIRED]");
  }

  const reference = readRequiredString(body, "reference");

  const programId = readRequiredString(body, "programId");

  const instructionId = readOptionalString(body, "instructionId");

  const source = parseLocation(body.source, "source");

  const destination = parseLocation(body.destination, "destination");

  const requestedAmount = parseRequestedAmount(body.requestedAmount);

  const destinationCurrency = readRequiredString(body, "destinationCurrency");

  const purpose = readRequiredString(body, "purpose");

  return {
    reference,

    payload: {
      programId,

      instructionId,

      source,

      destination,

      requestedAmount,

      destinationCurrency,

      purpose,
    },
  };
}

function isInputError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith("[TREASURY_TRANSFER_ORIGINATION_")
  );
}

function isErrorCode(
  error: unknown,

  code: string,
): boolean {
  return error instanceof Error && error.message.includes(code);
}

export async function originateTreasuryTransferHttp(params: {
  request: Request;

  principal: Principal;

  prisma: PrismaClient;

  generateIdentity?: IdentityFactory;

  now?: () => Date;
}): Promise<ControlCenterTreasuryTransferOriginationHttpResult> {
  const {
    request,
    principal,
    prisma,
    generateIdentity = randomUUID,
    now = () => new Date(),
  } = params;

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();

  if (!idempotencyKey) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "IDEMPOTENCY_KEY_REQUIRED",
      },
    };
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      status: 400,

      body: {
        ok: false,

        error: "INVALID_JSON_BODY",
      },
    };
  }

  let parsed: ParsedOriginationRequest;

  try {
    parsed = parseOriginationRequest(body);
  } catch (error: unknown) {
    if (isInputError(error)) {
      return {
        status: 400,

        body: {
          ok: false,

          error:
            error instanceof Error
              ? error.message
              : "INVALID_ORIGINATION_REQUEST",
        },
      };
    }

    throw error;
  }

  const transferId = `treasury-transfer-${generateIdentity()}`;

  const commandId = `treasury-transfer-origination-command-${generateIdentity()}`;

  const eventId = `treasury-transfer-created-event-${generateIdentity()}`;

  const correlationId = `treasury-transfer-origination-${generateIdentity()}`;

  const requestedAt = now();

  const originationRequest = {
    transferId,

    reference: parsed.reference,

    eventId,

    context: {
      commandId,

      actorId: principal.userId,

      correlationId,

      requestedAt,

      idempotencyKey,
    },

    payload: parsed.payload,
  };

  async function execute() {
    return prisma.$transaction(async (tx: TransactionClient) =>
      originateTreasuryTransferIdempotentlyWithClient({
        request: originationRequest,

        client: tx,
      }),
    );
  }

  let result;

  try {
    result = await execute();
  } catch (error: unknown) {
    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION")) {
      return {
        status: 409,

        body: {
          ok: false,

          error: "TREASURY_TRANSFER_IDEMPOTENCY_COLLISION",
        },
      };
    }

    if (isErrorCode(error, "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_CONFLICT")) {
      try {
        result = await execute();
      } catch (retryError: unknown) {
        if (
          isErrorCode(
            retryError,
            "TREASURY_GATEWAY_COMMAND_IDEMPOTENCY_COLLISION",
          )
        ) {
          return {
            status: 409,

            body: {
              ok: false,

              error: "TREASURY_TRANSFER_IDEMPOTENCY_COLLISION",
            },
          };
        }

        throw retryError;
      }
    } else {
      throw error;
    }
  }

  return {
    status: result.disposition === "CREATED" ? 201 : 200,

    body: {
      ok: true,

      disposition: result.disposition,

      transfer: {
        id: result.aggregate.id,

        reference: result.aggregate.reference,

        status: result.aggregate.status,

        version: result.aggregate.metadata.version,

        programId: result.aggregate.programId,

        requestedAmount: {
          ...result.aggregate.requestedAmount,
        },

        destinationCurrency: result.aggregate.destinationCurrency,

        purpose: result.aggregate.purpose,

        createdAt: result.aggregate.metadata.createdAt.toISOString(),
      },
    },
  };
}
