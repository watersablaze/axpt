import { PrismaClient } from "@prisma/client";

import {
  authorizeDigitalSettlementPrincipalWithClient,
  type DigitalSettlementPrincipalAuthorizationClient,
} from "../../src/domains/instruments/commands/authorizeDigitalSettlementPrincipalWithClient";
import {
  confirmDigitalSettlementVerificationWithClient,
  type DigitalSettlementVerificationClient,
} from "../../src/domains/instruments/commands/confirmDigitalSettlementVerificationWithClient";
import { HINES_DSI_REFERENCE } from "../../src/domains/instruments/definitions/hinesDigitalSettlementV1Definition";

const prisma = new PrismaClient();

const ACTION = {
  CONFIRM_VERIFICATION: "CONFIRM_VERIFICATION",
  AUTHORIZE_PRINCIPAL: "AUTHORIZE_PRINCIPAL",
} as const;

async function main() {
  const actorEmail = process.env.INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL?.trim();
  const action = process.env.FW_DSI_ACTION?.trim();

  if (!actorEmail) {
    throw new Error("INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL is required");
  }

  if (
    action !== ACTION.CONFIRM_VERIFICATION &&
    action !== ACTION.AUTHORIZE_PRINCIPAL
  ) {
    throw new Error(
      `FW_DSI_ACTION must be ${ACTION.CONFIRM_VERIFICATION} or ${ACTION.AUTHORIZE_PRINCIPAL}`,
    );
  }

  const actor = await prisma.user.findUnique({
    where: { email: actorEmail },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!actor) {
    throw new Error(`[INSTRUMENT_OPERATOR_NOT_FOUND] ${actorEmail}`);
  }

  if (!actor.isAdmin) {
    throw new Error(`[INSTRUMENT_OPERATOR_NOT_ADMIN] ${actorEmail}`);
  }

  const result = await prisma.$transaction(
    async (
      tx: DigitalSettlementVerificationClient &
        DigitalSettlementPrincipalAuthorizationClient,
    ) => {
      if (action === ACTION.CONFIRM_VERIFICATION) {
        const transactionHash = process.env.FW_DSI_VERIFICATION_TX_HASH?.trim();
        const observedAmountUsdt =
          process.env.FW_DSI_VERIFICATION_AMOUNT_USDT?.trim();
        const observedReceivingAddress =
          process.env.FW_DSI_VERIFICATION_RECEIVING_ADDRESS?.trim();

        if (
          !transactionHash ||
          !observedAmountUsdt ||
          !observedReceivingAddress
        ) {
          throw new Error(
            "Verification confirmation requires FW_DSI_VERIFICATION_TX_HASH, FW_DSI_VERIFICATION_AMOUNT_USDT, and FW_DSI_VERIFICATION_RECEIVING_ADDRESS",
          );
        }

        return confirmDigitalSettlementVerificationWithClient({
          client: tx as DigitalSettlementVerificationClient,
          instrumentReference: HINES_DSI_REFERENCE,
          transactionHash,
          observedAmountUsdt,
          observedReceivingAddress,
          actorUserId: actor.id,
        });
      }

      return authorizeDigitalSettlementPrincipalWithClient({
        client: tx as DigitalSettlementPrincipalAuthorizationClient,
        instrumentReference: HINES_DSI_REFERENCE,
        actorUserId: actor.id,
      });
    },
  );

  console.log(JSON.stringify({ ok: true, action, actor, result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
