import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/domains/auth/permissions";
import { requirePermission } from "@/domains/auth/requirePermission";
import { applyTreasuryExecutionPlanHttp } from "@/domains/control-center/treasury/applyTreasuryExecutionPlanHttp";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = Readonly<{
  params: Promise<{
    transferId: string;

    planId: string;
  }>;
}>;

export async function POST(request: Request, context: RouteContext) {
  const principal = await requirePermission(PERMISSIONS.TREASURY_APPROVE);

  const { transferId, planId } = await context.params;

  const result = await applyTreasuryExecutionPlanHttp({
    rawTransferId: transferId,

    rawPlanId: planId,

    request,

    principal,

    prisma,
  });

  return NextResponse.json(result.body, {
    status: result.status,
  });
}
