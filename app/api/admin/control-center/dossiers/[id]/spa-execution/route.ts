import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";
import {
  confirmDossierSpaExecution,
  getSpaExecutionConfirmationStatus,
} from "@/domains/control-center/dossiers/dossierSpaExecution";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type Body = {
  executedAt?: string;
  buyerSignatory?: string;
  sellerSignatory?: string;
  evidenceReference?: string;
  fileUrl?: string | null;
};

export async function GET(
  _req: Request,
  context: RouteContext,
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

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: {
        id,
      },
      include: {
        instruments: {
          where: {
            type: "SPA",
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
        events: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!dossier) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DOSSIER_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  const instrument =
    dossier.instruments[0] ?? null;

  return NextResponse.json({
    ok: true,
    dossierId:
      dossier.id,
    state:
      dossier.state,
    instrument,
    confirmation:
      getSpaExecutionConfirmationStatus({
        instrument,
        events:
          dossier.events,
      }),
  });
}

export async function POST(
  req: Request,
  context: RouteContext,
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

  try {
    const result =
      await confirmDossierSpaExecution({
        dossierId:
          id,
        operatorEmail:
          principal.email,
        executedAt:
          body.executedAt ?? "",
        buyerSignatory:
          body.buyerSignatory ?? "",
        sellerSignatory:
          body.sellerSignatory ?? "",
        evidenceReference:
          body.evidenceReference ?? "",
        fileUrl:
          body.fileUrl ?? null,
      });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    const status =
      message ===
      "DOSSIER_NOT_FOUND"
        ? 404
        : message ===
            "SPA_DRAFTING_NOT_ACTIVE"
          ? 409
          : message ===
              "SPA_INSTRUMENT_NOT_FOUND"
            ? 409
            : message ===
                "SPA_MUST_BE_ACTIVE_BEFORE_EXECUTION_CONFIRMATION"
              ? 409
              : 400;

    return NextResponse.json(
      {
        ok: false,
        error:
          message,
      },
      {
        status,
      },
    );
  }
}
