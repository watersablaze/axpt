import type { PrismaClient, TransactionClient } from "@prisma/client";

import type { TreasuryTransferId } from "../../treasury/gateway/shared/identifiers";

import { loadTransferExecutionPerceptionWithClient } from "../../treasury/gateway/transfer-execution-summary/application/loadTransferExecutionPerceptionWithClient";

import type { TransferExecutionPerception } from "../../treasury/gateway/transfer-execution-summary/perceptionContracts";

import { toControlCenterTransferExecutionPerception } from "./transferExecutionPerception";

type LoadTransferExecutionPerception = (params: {
  transferId: TreasuryTransferId;

  client: TransactionClient;
}) => Promise<TransferExecutionPerception | null>;

export type ControlCenterTransferExecutionHttpResult =
  | Readonly<{
      status: 200;

      body: Readonly<{
        ok: true;

        perception: ReturnType<
          typeof toControlCenterTransferExecutionPerception
        >;
      }>;
    }>
  | Readonly<{
      status: 400;

      body: Readonly<{
        ok: false;

        error: "TRANSFER_ID_REQUIRED";
      }>;
    }>
  | Readonly<{
      status: 404;

      body: Readonly<{
        ok: false;

        error: "TREASURY_TRANSFER_NOT_FOUND";
      }>;
    }>;

export async function loadTransferExecutionSummaryHttp(params: {
  rawTransferId: string;

  prisma: PrismaClient;

  loadPerception?: LoadTransferExecutionPerception;
}): Promise<ControlCenterTransferExecutionHttpResult> {
  const {
    rawTransferId,
    prisma,
    loadPerception = loadTransferExecutionPerceptionWithClient,
  } = params;

  const transferId = rawTransferId.trim();

  if (transferId.length === 0) {
    return {
      status: 400,

      body: {
        ok: false,

        error: "TRANSFER_ID_REQUIRED",
      },
    };
  }

  const perception = await prisma.$transaction((tx: TransactionClient) =>
    loadPerception({
      transferId,

      client: tx,
    }),
  );

  if (!perception) {
    return {
      status: 404,

      body: {
        ok: false,

        error: "TREASURY_TRANSFER_NOT_FOUND",
      },
    };
  }

  return {
    status: 200,

    body: {
      ok: true,

      perception: toControlCenterTransferExecutionPerception(perception),
    },
  };
}
