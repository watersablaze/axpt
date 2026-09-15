import { PrismaClient } from "@prisma/client";

import {
  bootstrapGreatMotherV1WithClient,
  type InstrumentBootstrapClient,
} from "../../src/domains/instruments/bootstrap/bootstrapGreatMotherV1WithClient";

const prisma = new PrismaClient();

async function main() {
  const actorEmail =
    process.env.INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL?.trim();

  if (!actorEmail) {
    throw new Error(
      "INSTRUMENT_BOOTSTRAP_ACTOR_EMAIL is required",
    );
  }

  const actor = await prisma.user.findUnique({
    where: {
      email: actorEmail,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      isAdmin: true,
    },
  });

  if (!actor) {
    throw new Error(
      `[INSTRUMENT_BOOTSTRAP_ACTOR_NOT_FOUND] ${actorEmail}`,
    );
  }

  if (!actor.isAdmin) {
    throw new Error(
      `[INSTRUMENT_BOOTSTRAP_ACTOR_NOT_ADMIN] ${actorEmail}`,
    );
  }

  const result = await prisma.$transaction(
    (tx: InstrumentBootstrapClient) =>
      bootstrapGreatMotherV1WithClient({
      client: tx,
        actorUserId: actor.id,
      }),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        actor,
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
