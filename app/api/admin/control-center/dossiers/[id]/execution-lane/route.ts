import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";

import {
  isDossierExecutionLaneTarget,
  openDossierExecutionLane,
} from "@/domains/control-center/dossiers/openDossierExecutionLane";

type Body = {
  toState?: string;
};

export async function POST(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  const { id } =
    await context.params;

  const body =
    (await req.json()) as Body;

  if (
    !body.toState ||
    !isDossierExecutionLaneTarget(
      body.toState,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_EXECUTION_LANE_TARGET",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result =
      await openDossierExecutionLane({
        dossierId:
          id,
        toState:
          body.toState,
        operatorEmail:
          principal.email,
        operatorRoles:
          principal.roles,
      });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message ===
      "DOSSIER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        {
          status: 404,
        },
      );
    }

    if (
      message ===
      "DOSSIER_EXECUTION_LANE_APPROVAL_BLOCKED"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        {
          status: 403,
        },
      );
    }

    if (
      [
        "DOSSIER_NOT_READY_FOR_EXECUTION_LANE_OPEN",
        "DOSSIER_EXECUTION_LANE_PROFILE_BLOCKED",
        "DOSSIER_EXECUTION_LANE_ARTIFACT_BLOCKED",
        "DOSSIER_EXECUTION_LANE_STATE_CHANGED",
        "DOSSIER_EXECUTION_LANE_STATE_WITHOUT_AUTHORITY_EVENT",
      ].includes(message)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        {
          status: 409,
        },
      );
    }

    if (
      message ===
      "DOSSIER_EXECUTION_LANE_REGISTRY_MISSING"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: message,
        },
        {
          status: 500,
        },
      );
    }

    console.error(
      "[DOSSIER_EXECUTION_LANE_OPEN_FAILED]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "DOSSIER_EXECUTION_LANE_OPEN_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}
