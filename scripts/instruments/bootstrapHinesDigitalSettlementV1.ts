import { PrismaClient } from "@prisma/client";

import {
  bootstrapHinesDigitalSettlementV1WithClient,
  type DigitalSettlementBootstrapClient,
} from "../../src/domains/instruments/bootstrap/bootstrapHinesDigitalSettlementV1WithClient";
import {
  issueDigitalSettlementInstructionWithClient,
  type DigitalSettlementIssuanceClient,
} from "../../src/domains/instruments/commands/issueDigitalSettlementInstructionWithClient";
import { HINES_DSI_REFERENCE } from "../../src/domains/instruments/definitions/hinesDigitalSettlementV1Definition";

const prisma = new PrismaClient();

async function main() {
  const actorEmail = process.env.INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL?.trim();
  const receivingAddress = process.env.FW_DSI_RECEIVING_ADDRESS?.trim();

  if (!actorEmail) {
    throw new Error("INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL is required");
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

  const result = await prisma.$transaction(async (
    tx: DigitalSettlementBootstrapClient & DigitalSettlementIssuanceClient,
  ) => {
    const bootstrap = await bootstrapHinesDigitalSettlementV1WithClient({
      client: tx as DigitalSettlementBootstrapClient,
      actorUserId: actor.id,
    });

    const issuance = receivingAddress
      ? await issueDigitalSettlementInstructionWithClient({
          client: tx as DigitalSettlementIssuanceClient,
          instrumentReference: HINES_DSI_REFERENCE,
          receivingAddress,
          actorUserId: actor.id,
        })
      : null;

    return { bootstrap, issuance };
  });

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
