import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/domains/auth/permissions";

import { requirePermission } from "@/domains/auth/requirePermission";

import { applyTransferCapacityAssessmentHttp } from "@/domains/control-center/treasury/applyTransferCapacityAssessmentHttp";

import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = Readonly<{
  params: Promise<{
    transferId: string;

    assessmentId: string;
  }>;
}>;

export async function POST(request: Request, context: RouteContext) {
  const principal = await requirePermission(PERMISSIONS.TREASURY_APPROVE);

  const { transferId, assessmentId } = await context.params;

  const result = await applyTransferCapacityAssessmentHttp({
    rawTransferId: transferId,

    rawAssessmentId: assessmentId,

    request,

    principal,

    prisma,
  });

  return NextResponse.json(result.body, {
    status: result.status,
  });
}
