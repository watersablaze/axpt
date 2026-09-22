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
  getDigitalSettlementRecognitionReceiptCandidateHttp,
} from "@/domains/control-center/treasury/getDigitalSettlementRecognitionReceiptCandidateHttp";

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

export async function GET(
  _request:
    Request,

  context:
    RouteContext,
) {
  await requirePermission(
    PERMISSIONS.TREASURY_READ,
  );

  const {
    reference,
  } =
    await context.params;

  const result =
    await getDigitalSettlementRecognitionReceiptCandidateHttp({
      rawInstrumentReference:
        reference,

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
