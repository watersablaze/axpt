import { PrismaClient } from "@prisma/client";

import { getRecognizedCapitalPositionWithClient } from "../../src/domains/treasury/gateway/capital-receipts/application/getRecognizedCapitalPositionWithClient";

import { TREASURY_AGGREGATE_TYPE } from "../../src/domains/treasury/gateway/events/aggregateTypes";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "../../src/domains/treasury/gateway/capital-receipts/status";

import { compareDecimals } from "../../src/domains/treasury/gateway/shared/decimalAmount";

import type { ProgramCapitalReceipt } from "../../src/domains/treasury/gateway/capital-receipts/contracts";

const prisma = new PrismaClient();

const PREFIX = "smoke-recognized-position";

const ACCOUNT_X = `${PREFIX}-account-x`;

const ACCOUNT_Y = `${PREFIX}-account-y`;

function makeReceipt(params: {
  id: string;
  programAccountId: string;
  currency: string;
  recognizedAmount?: string;
  status:
    | typeof PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED
    | typeof PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED
    | typeof PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED;
  version: number;
}): ProgramCapitalReceipt {
  const {
    id,
    programAccountId,
    currency,
    recognizedAmount,
    status,
    version,
  } = params;

  const now = new Date("2026-09-04T12:00:00.000Z");

  return {
    id,

    reference: `${id}-reference`,

    programId: `${PREFIX}-program`,

    destinationProgramAccountId: programAccountId,

    declaredAmount: {
      amount: recognizedAmount ?? "200000.00",

      currency,
    },

    verifiedAmount: {
      amount: recognizedAmount ?? "200000.00",

      currency,
    },

    ...(recognizedAmount
      ? {
          recognizedAmount: {
            amount: recognizedAmount,

            currency,
          },

          recognizedAt: now,
        }
      : {}),

    receiptMethod: "DIGITAL_ASSET_TRANSFER",

    status,

    receivedAt: now,

    verifiedAt: now,

    metadata: {
      createdAt: now,

      updatedAt: now,

      createdByActorId: `${PREFIX}-actor`,

      lastModifiedByActorId: `${PREFIX}-actor`,

      version,
    },
  };
}

async function persistReceipt(receipt: ProgramCapitalReceipt) {
  await prisma.treasuryGatewayAggregate.create({
    data: {
      aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

      aggregateId: receipt.id,

      version: receipt.metadata.version,

      status: receipt.status,

      snapshot: receipt,
    },
  });
}

async function main() {
  await prisma.treasuryGatewayAggregate.deleteMany({
    where: {
      aggregateType: TREASURY_AGGREGATE_TYPE.PROGRAM_CAPITAL_RECEIPT,

      aggregateId: {
        startsWith: PREFIX,
      },
    },
  });

  const receiptA = makeReceipt({
    id: `${PREFIX}-receipt-a`,
    programAccountId: ACCOUNT_X,
    currency: "USDT",
    recognizedAmount: "500000.00",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
    version: 6,
  });

  const receiptB = makeReceipt({
    id: `${PREFIX}-receipt-b`,
    programAccountId: ACCOUNT_X,
    currency: "USDT",
    recognizedAmount: "250000.00",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
    version: 6,
  });

  const receiptC = makeReceipt({
    id: `${PREFIX}-receipt-c`,
    programAccountId: ACCOUNT_X,
    currency: "USD",
    recognizedAmount: "100000.00",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
    version: 6,
  });

  const receiptD = makeReceipt({
    id: `${PREFIX}-receipt-d`,
    programAccountId: ACCOUNT_Y,
    currency: "USDT",
    recognizedAmount: "300000.00",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED,
    version: 6,
  });

  const receiptE = makeReceipt({
    id: `${PREFIX}-receipt-e`,
    programAccountId: ACCOUNT_X,
    currency: "USDT",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.VERIFIED,
    version: 5,
  });

  const receiptF = makeReceipt({
    id: `${PREFIX}-receipt-f`,
    programAccountId: ACCOUNT_X,
    currency: "USDT",
    recognizedAmount: "150000.00",
    status: PROGRAM_CAPITAL_RECEIPT_STATUS.REVERSED,
    version: 7,
  });

  for (const receipt of [
    receiptA,
    receiptB,
    receiptC,
    receiptD,
    receiptE,
    receiptF,
  ]) {
    await persistReceipt(receipt);
  }

  const position = await getRecognizedCapitalPositionWithClient({
    programAccountId: ACCOUNT_X,

    currency: "USDT",

    client: prisma,
  });

  const emptyPosition = await getRecognizedCapitalPositionWithClient({
    programAccountId: `${PREFIX}-empty-account`,

    currency: "USDT",

    client: prisma,
  });

  const contributingReceiptIds = [...position.contributingReceiptIds].sort();

  const expectedReceiptIds = [receiptA.id, receiptB.id].sort();

  const invariants = {
    recognizedReceiptsContribute:
      contributingReceiptIds.length === 2 &&
      contributingReceiptIds.every(
        (id, index) => id === expectedReceiptIds[index],
      ),

    sameAccountDifferentCurrencyExcluded:
      !contributingReceiptIds.includes(receiptC.id),

    differentAccountExcluded:
      !contributingReceiptIds.includes(receiptD.id),

    verifiedButUnrecognizedExcluded:
      !contributingReceiptIds.includes(receiptE.id),

    reversedReceiptExcluded:
      !contributingReceiptIds.includes(receiptF.id),

    recognizedPositionEqualsCanonicalSum:
      compareDecimals(position.recognizedAmount.amount, "750000.00") === 0 &&
      position.recognizedAmount.currency === "USDT",

    emptyPositionIsZero:
      compareDecimals(emptyPosition.recognizedAmount.amount, "0") === 0 &&
      emptyPosition.recognizedAmount.currency === "USDT" &&
      emptyPosition.contributingReceiptIds.length === 0,
  };

  for (const [name, passed] of Object.entries(invariants)) {
    if (!passed) {
      throw new Error(`[SMOKE_RECOGNIZED_CAPITAL_POSITION_FAILED] ${name}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,

        position,

        emptyPosition,

        persistedCases: {
          recognizedSameAccountSameCurrency: 2,
          recognizedDifferentCurrency: 1,
          recognizedDifferentAccount: 1,
          verifiedButUnrecognized: 1,
          reversed: 1,
        },

        invariants,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
