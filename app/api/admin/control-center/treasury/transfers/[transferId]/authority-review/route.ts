import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/domains/auth/permissions";

import { requirePermission } from "@/domains/auth/requirePermission";

import { beginTreasuryTransferAuthorityReviewHttp } from "@/domains/control-center/treasury/beginTreasuryTransferAuthorityReviewHttp";

import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = Readonly<{
  params: Promise<{
    transferId: string;
  }>;
}>;

export async function POST(
  request: Request,

  context: RouteContext,
) {
  const principal = await requirePermission(PERMISSIONS.TREASURY_REVIEW);

  const { transferId } = await context.params;

  const result = await beginTreasuryTransferAuthorityReviewHttp({
    rawTransferId: transferId,

    request,

    principal,

    prisma,
  });

  return NextResponse.json(
    result.body,

    {
      status: result.status,
    },
  );
}
