import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/domains/auth/permissions";

import { requirePermission } from "@/domains/auth/requirePermission";

import { loadTransferExecutionSummaryHttp } from "@/domains/control-center/treasury/loadTransferExecutionSummaryHttp";

import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = Readonly<{
  params: Promise<{
    transferId: string;
  }>;
}>;

export async function GET(
  _request: Request,

  context: RouteContext,
) {
  await requirePermission(PERMISSIONS.TREASURY_READ);

  const { transferId } = await context.params;

  const result = await loadTransferExecutionSummaryHttp({
    rawTransferId: transferId,

    prisma,
  });

  return NextResponse.json(
    result.body,

    {
      status: result.status,
    },
  );
}
