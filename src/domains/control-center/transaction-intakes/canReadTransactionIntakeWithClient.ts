import type { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "@/domains/auth/permissions";

type ReadPrincipal = {
  userId: string;
  roles: readonly string[];
  permissions: readonly string[];
} | null;

/**
 * Private intake registry and detail read boundary.
 * An authenticated admin-layout entrance is insufficient by itself.
 * No grant or governing standing is inferred by this reader.
 */
export async function canReadTransactionIntakeWithClient(input: {
  client: Pick<PrismaClient, "user">;
  principal: ReadPrincipal;
}): Promise<boolean> {
  const { client, principal } = input;

  if (
    !principal?.userId ||
    !principal.roles.includes("ADMIN_PLATFORM") ||
    !principal.permissions.includes(PERMISSIONS.ADMIN_SURFACE_ACCESS)
  ) {
    return false;
  }

  const operator = await client.user.findUnique({
    where: { id: principal.userId },
    select: { isAdmin: true },
  });

  return operator?.isAdmin === true;
}
