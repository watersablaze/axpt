import {
  NextResponse,
} from "next/server";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  runSettlementObserverCycleWithClient,
  type SettlementObserverCycleClient,
} from "@/domains/treasury/settlement-observer/runSettlementObserverCycleWithClient";

const ENABLE_TOKEN =
  "ENABLED";

const COMMAND =
  "RUN_ONE_BLOCK";

type Body = Readonly<{
  command?: string;
  bootstrapFromBlock?: string;
}>;

function parseOptionalBlock(
  value: string | undefined,
): bigint | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized =
    value.trim();

  if (!/^\d+$/.test(normalized)) {
    throw new Error(
      "[SETTLEMENT_OBSERVER_BOOTSTRAP_BLOCK_INVALID]",
    );
  }

  return BigInt(
    normalized,
  );
}

function serialize(
  result:
    Awaited<
      ReturnType<
        typeof runSettlementObserverCycleWithClient
      >
    >,
) {
  return {
    disposition:
      result.disposition,

    chainId:
      result.chainId,

    network:
      result.network,

    watchedAddress:
      result.watchedAddress,

    tokenContractAddress:
      result.tokenContractAddress,

    headBlock:
      result.headBlock.toString(),

    cursorBefore:
      result.cursorBefore
        ?.toString() ??
      null,

    scannedFrom:
      result.scannedFrom
        ?.toString() ??
      null,

    scannedTo:
      result.scannedTo
        ?.toString() ??
      null,

    cursorAfter:
      result.cursorAfter
        ?.toString() ??
      null,

    observed:
      result.observed,

    persisted:
      result.persisted,

    validationCandidates:
      result.validationCandidates,

    validated:
      result.validated,

    chainUnavailable:
      result.chainUnavailable,
  };
}

export async function POST(
  request: Request,
) {
  try {
    /*
     * This route is an operator invocation boundary only.
     *
     * It does not:
     * - recognize a DSI verification transfer
     * - issue an instrument
     * - authorize remaining TAP
     * - send communications
     */
    if (
      process.env.VERCEL_ENV !==
      "production"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SETTLEMENT_OBSERVER_PRODUCTION_RUNTIME_REQUIRED",
        },
        {
          status: 403,
        },
      );
    }

    if (
      process.env
        .TREASURY_SETTLEMENT_OBSERVER_ENABLED
        ?.trim() !==
      ENABLE_TOKEN
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SETTLEMENT_OBSERVER_NOT_ENABLED",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !process.env.RPC_URL
        ?.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SETTLEMENT_OBSERVER_RPC_URL_MISSING",
        },
        {
          status: 500,
        },
      );
    }

    if (
      !process.env.DATABASE_URL
        ?.trim()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SETTLEMENT_OBSERVER_DATABASE_URL_MISSING",
        },
        {
          status: 500,
        },
      );
    }

    const principal =
      await getPrincipal();

    if (!principal) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
        },
      );
    }

    if (
      !principal.roles.includes(
        "ADMIN_PLATFORM",
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "ADMIN_PLATFORM_REQUIRED",
        },
        {
          status: 403,
        },
      );
    }

    const actor =
      await prisma.user.findUnique({
        where: {
          email:
            principal.email,
        },

        select: {
          id: true,
          email: true,
        },
      });

    if (!actor) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "OPERATOR_USER_NOT_FOUND",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      (await request.json()) as Body;

    if (
      body.command !==
      COMMAND
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "SETTLEMENT_OBSERVER_COMMAND_REQUIRED",
          expectedCommand:
            COMMAND,
        },
        {
          status: 400,
        },
      );
    }

    const bootstrapFromBlock =
      parseOptionalBlock(
        body.bootstrapFromBlock,
      );

    const result =
      await runSettlementObserverCycleWithClient({
        client:
          prisma as unknown as
            SettlementObserverCycleClient,

        bootstrapFromBlock,

        /*
         * Runtime invocation is deliberately narrower
         * than the general domain runner.
         *
         * One invocation may admit at most one new block.
         */
        maxNewBlocksPerCycle:
          1n,

        validationBatchSize:
          25,
      });

    return NextResponse.json({
      ok: true,

      operator: {
        userId:
          actor.id,

        email:
          actor.email,
      },

      result:
        serialize(
          result,
        ),
    });
  } catch (error) {
    console.error(
      "[TREASURY_SETTLEMENT_OBSERVER_ROUTE_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          "TREASURY_SETTLEMENT_OBSERVER_ROUTE_FAILED",

        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
