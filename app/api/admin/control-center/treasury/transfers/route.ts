import { NextResponse } from "next/server";

import { PERMISSIONS } from "@/domains/auth/permissions";

import { requirePermission } from "@/domains/auth/requirePermission";

import { originateTreasuryTransferHttp } from "@/domains/control-center/treasury/originateTreasuryTransferHttp";

import { prisma } from "@/infrastructure/db/prisma";

export async function POST(request: Request) {
  const principal = await requirePermission(PERMISSIONS.TREASURY_ORIGINATE);

  const result = await originateTreasuryTransferHttp({
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
