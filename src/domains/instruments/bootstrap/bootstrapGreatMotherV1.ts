import { prisma } from "@/lib/prisma";

import {
  bootstrapGreatMotherV1WithClient,
  type InstrumentBootstrapClient,
} from "./bootstrapGreatMotherV1WithClient";

export async function bootstrapGreatMotherV1(params: {
  actorUserId: string;
}) {
  return prisma.$transaction(
    (tx: InstrumentBootstrapClient) =>
      bootstrapGreatMotherV1WithClient({
        client: tx,
        actorUserId: params.actorUserId,
      }),
  );
}
