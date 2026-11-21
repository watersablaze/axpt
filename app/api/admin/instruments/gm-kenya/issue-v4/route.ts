import {
  NextResponse,
} from "next/server";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  isAdmin,
} from "@/domains/auth/isAdmin";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  runInstrumentGovernanceTransaction,
} from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";

import {
  issueGlobalMotherV4WithClient,
} from "@/domains/instruments/commands/issueGlobalMotherV4WithClient";

export async function POST(
  request: Request,
) {
  const origin =
    request.headers.get(
      "origin",
    );

  if (
    origin !==
    new URL(
      request.url,
    ).origin
  ) {
    return NextResponse.json(
      {
        error:
          "ORIGIN_REQUIRED",
      },
      {
        status:
          403,
      },
    );
  }

  const principal =
    await getPrincipal();

  if (
    !principal ||
    !isAdmin(
      principal,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "FORBIDDEN",
      },
      {
        status:
          403,
      },
    );
  }

  let input:
    unknown;

  try {
    input =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "INVALID_PAYLOAD",
      },
      {
        status:
          400,
      },
    );
  }

  if (
    !input ||
    typeof input !==
      "object" ||
    Array.isArray(
      input,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "INVALID_PAYLOAD",
      },
      {
        status:
          400,
      },
    );
  }

  const values =
    input as Record<
      string,
      unknown
    >;

  if (
    values.confirmation !==
      "ISSUE GM V4" ||
    typeof values.versionId !==
      "string"
  ) {
    return NextResponse.json(
      {
        error:
          "CONFIRMATION_REQUIRED",
      },
      {
        status:
          400,
      },
    );
  }

  try {
    const result =
      await runInstrumentGovernanceTransaction(
        prisma,

        tx =>
          issueGlobalMotherV4WithClient(
            {
              client:
                tx,

              actorUserId:
                principal.userId,

              expectedVersionId:
                values.versionId as string,
            },
          ),

        {
          timeoutMs:
            30_000,
        },
      );

    return NextResponse.json(
      {
        ok:
          true,

        versionId:
          result.versionId,

        issuedAt:
          result.issuedAt
            .toISOString(),
      },
    );
  } catch (
    error
  ) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.startsWith(
        "[GM_V4_ISSUANCE_",
      )
    ) {
      return NextResponse.json(
        {
          error:
            message,
        },
        {
          status:
            409,
        },
      );
    }

    console.error(
      "[gm-v4/issue] failed",
      error,
    );

    return NextResponse.json(
      {
        error:
          "ISSUANCE_FAILED",
      },
      {
        status:
          500,
      },
    );
  }
}
