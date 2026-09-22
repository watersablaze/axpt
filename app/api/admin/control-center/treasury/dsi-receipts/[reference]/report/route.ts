import {
  NextResponse,
} from "next/server";

import {
  PERMISSIONS,
} from "@/domains/auth/permissions";

import {
  requirePermission,
} from "@/domains/auth/requirePermission";

import {
  reportDigitalSettlementRecognitionReceiptHttp,
} from "@/domains/control-center/treasury/reportDigitalSettlementRecognitionReceiptHttp";

import {
  prisma,
} from "@/infrastructure/db/prisma";

type RouteContext =
  Readonly<{
    params:
      Promise<{
        reference:
          string;
      }>;
  }>;

export async function POST(
  request:
    Request,

  context:
    RouteContext,
) {
  const principal =
    await requirePermission(
      PERMISSIONS.TREASURY_ORIGINATE,
    );

  const {
    reference,
  } =
    await context.params;

  const result =
    await reportDigitalSettlementRecognitionReceiptHttp({
      rawInstrumentReference:
        reference,

      request,

      principal,

      prisma,
    });

  return NextResponse.json(
    result.body,

    {
      status:
        result.status,
    },
  );
}
