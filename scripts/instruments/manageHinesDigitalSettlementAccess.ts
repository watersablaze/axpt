import { PrismaClient } from "@prisma/client";

import {
  issueInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantIssuanceClient,
} from "../../src/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import {
  revokeInstrumentAccessGrantWithClient,
  type InstrumentAccessGrantRevocationClient,
} from "../../src/domains/instruments/commands/revokeInstrumentAccessGrantWithClient";
import {
  HINES_DSI_PUBLIC_ID,
  HINES_DSI_REFERENCE,
} from "../../src/domains/instruments/definitions/hinesDigitalSettlementV1Definition";

const prisma = new PrismaClient();

const ACTION = {
  ISSUE: "ISSUE",
  REVOKE: "REVOKE",
} as const;

async function main() {
  const actorEmail = process.env.INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL?.trim();
  const action = process.env.INSTRUMENT_ACCESS_ACTION?.trim();

  if (!actorEmail) {
    throw new Error("INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL is required");
  }

  if (action !== ACTION.ISSUE && action !== ACTION.REVOKE) {
    throw new Error(
      `INSTRUMENT_ACCESS_ACTION must be ${ACTION.ISSUE} or ${ACTION.REVOKE}`,
    );
  }

  const actor = await prisma.user.findUnique({
    where: { email: actorEmail },
    select: { id: true, email: true, isAdmin: true },
  });

  if (!actor) {
    throw new Error(`[INSTRUMENT_ACCESS_ACTOR_NOT_FOUND] ${actorEmail}`);
  }

  if (!actor.isAdmin) {
    throw new Error(`[INSTRUMENT_ACCESS_ACTOR_NOT_ADMIN] ${actorEmail}`);
  }

  const result = await prisma.$transaction(
    async (
      tx: InstrumentAccessGrantIssuanceClient &
        InstrumentAccessGrantRevocationClient,
    ) => {
      if (action === ACTION.REVOKE) {
        const accessGrantId = process.env.INSTRUMENT_ACCESS_GRANT_ID?.trim();

        if (!accessGrantId) {
          throw new Error(
            "INSTRUMENT_ACCESS_GRANT_ID is required for revocation",
          );
        }

        return revokeInstrumentAccessGrantWithClient({
          client: tx,
          accessGrantId,
          revokedByUserId: actor.id,
        });
      }

      const recipientName =
        process.env.INSTRUMENT_ACCESS_RECIPIENT_NAME?.trim();
      const expiryHours = Number(
        process.env.INSTRUMENT_ACCESS_EXPIRES_HOURS?.trim() ?? "72",
      );

      if (!recipientName) {
        throw new Error("INSTRUMENT_ACCESS_RECIPIENT_NAME is required");
      }

      if (!Number.isFinite(expiryHours) || expiryHours <= 0) {
        throw new Error("INSTRUMENT_ACCESS_EXPIRES_HOURS must be positive");
      }

      const issuance = await issueInstrumentAccessGrantWithClient({
        client: tx,
        instrumentReference: HINES_DSI_REFERENCE,
        recipientName,
        issuedByUserId: actor.id,
        expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
      });

      return {
        ...issuance,
        accessPath: `/french-ward/instruments/${HINES_DSI_PUBLIC_ID}/access/${issuance.token}`,
      };
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
