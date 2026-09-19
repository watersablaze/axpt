import { PrismaClient } from "@prisma/client";

import {
  bootstrapDigitalSettlementV1WithClient,
  type DigitalSettlementBootstrapClient,
} from "../../src/domains/instruments/bootstrap/bootstrapDigitalSettlementV1WithClient";
import {
  fixDigitalSettlementPricingWithClient,
  type DigitalSettlementPriceFixingClient,
} from "../../src/domains/instruments/commands/fixDigitalSettlementPricingWithClient";
import {
  issueDigitalSettlementInstructionWithClient,
  type DigitalSettlementIssuanceClient,
} from "../../src/domains/instruments/commands/issueDigitalSettlementInstructionWithClient";
import {
  DSI_REFERENCE,
  INDERAKSH_LEGAL_NAME,
} from "../../src/domains/instruments/definitions/digitalSettlementV1Definition";

const prisma = new PrismaClient();

async function main() {
  const actorEmail = process.env.INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL?.trim();
  const receivingAddress = process.env.FW_DSI_RECEIVING_ADDRESS?.trim();
  const spotPricePerKgUsd = process.env.FW_DSI_SPOT_PRICE_PER_KG_USD?.trim();
  const spotBenchmark = process.env.FW_DSI_SPOT_BENCHMARK?.trim();
  const configuredCounterpartyLegalName =
    process.env.FW_DSI_COUNTERPARTY_LEGAL_NAME?.trim();
  const counterpartyLegalName = INDERAKSH_LEGAL_NAME;

  if (!actorEmail) {
    throw new Error("INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL is required");
  }

  if (
    configuredCounterpartyLegalName &&
    configuredCounterpartyLegalName !== INDERAKSH_LEGAL_NAME
  ) {
    throw new Error(
      `[FW_DSI_COUNTERPARTY_LEGAL_NAME_MISMATCH] expected=${INDERAKSH_LEGAL_NAME} actual=${configuredCounterpartyLegalName}`,
    );
  }

  if (receivingAddress && (!spotPricePerKgUsd || !spotBenchmark)) {
    throw new Error(
      "Issuance requires FW_DSI_SPOT_PRICE_PER_KG_USD and FW_DSI_SPOT_BENCHMARK",
    );
  }

  const actor = await prisma.user.findUnique({
    where: { email: actorEmail },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!actor) {
    throw new Error(`[INSTRUMENT_BOOTSTRAP_ACTOR_NOT_FOUND] ${actorEmail}`);
  }

  if (!actor.isAdmin) {
    throw new Error(`[INSTRUMENT_BOOTSTRAP_ACTOR_NOT_ADMIN] ${actorEmail}`);
  }

  const result = await prisma.$transaction(
    async (
      tx: DigitalSettlementBootstrapClient &
        DigitalSettlementPriceFixingClient &
        DigitalSettlementIssuanceClient,
    ) => {
      const bootstrap = await bootstrapDigitalSettlementV1WithClient({
        client: tx as DigitalSettlementBootstrapClient,
        actorUserId: actor.id,
        counterpartyLegalName,
      });

      const pricing = receivingAddress
        ? await fixDigitalSettlementPricingWithClient({
            client: tx as DigitalSettlementPriceFixingClient,
            instrumentReference: DSI_REFERENCE,
            spotPricePerKgUsd: spotPricePerKgUsd!,
            spotBenchmark: spotBenchmark!,
            actorUserId: actor.id,
          })
        : null;

      const issuance = receivingAddress
        ? await issueDigitalSettlementInstructionWithClient({
            client: tx as DigitalSettlementIssuanceClient,
            instrumentReference: DSI_REFERENCE,
            receivingAddress,
            actorUserId: actor.id,
          })
        : null;

      return { bootstrap, pricing, issuance };
    },
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        actor,
        mode: result.issuance ? "ISSUED" : "DRAFT",
        result,
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
