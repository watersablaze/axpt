import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";

import {
  DOSSIER_KYC_REVIEW_CONFIRMED_EVENT,
  evaluateDossierKycReadiness,
  getDossierKycConfirmationStatus,
} from "@/domains/control-center/dossiers/dossierKycReview";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReviewBody = {
  confirmed?: boolean;
  note?: string | null;
};

async function loadKycContext(
  dossierId: string,
) {
  return prisma.transactionDossier.findUnique({
    where: {
      id: dossierId,
    },
    include: {
      parties: true,
      promotedOpportunities: {
        select: {
          id: true,
          source: true,
          title: true,
        },
      },
      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

function buildStatus(
  dossier: NonNullable<
    Awaited<
      ReturnType<
        typeof loadKycContext
      >
    >
  >,
) {
  const readiness =
    evaluateDossierKycReadiness({
      parties: dossier.parties,
      sourceOpportunities:
        dossier.promotedOpportunities,
    });

  const confirmation =
    getDossierKycConfirmationStatus({
      parties: dossier.parties,
      events: dossier.events,
    });

  return {
    dossierId: dossier.id,
    state: dossier.state,
    readiness,
    confirmation,
  };
}

export async function GET(
  _request: Request,
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
    await loadKycContext(id);

  if (!dossier) {
    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    review: buildStatus(dossier),
  });
}

export async function POST(
  request: Request,
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
    (await request.json()) as ReviewBody;

  if (body.confirmed !== true) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "KYC_REVIEW_CONFIRMATION_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  const dossier =
    await loadKycContext(id);

  if (!dossier) {
    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_NOT_FOUND",
      },
      {
        status: 404,
      },
    );
  }

  if (
    dossier.state !== "KYC_REVIEW"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "KYC_REVIEW_NOT_ACTIVE",
        state: dossier.state,
      },
      {
        status: 409,
      },
    );
  }

  const readiness =
    evaluateDossierKycReadiness({
      parties: dossier.parties,
      sourceOpportunities:
        dossier.promotedOpportunities,
    });

  if (!readiness.passed) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "KYC_REVIEW_NOT_READY",
        checks: readiness.checks,
      },
      {
        status: 409,
      },
    );
  }

  const existingConfirmation =
    getDossierKycConfirmationStatus({
      parties: dossier.parties,
      events: dossier.events,
    });

  if (
    existingConfirmation.current
  ) {
    return NextResponse.json({
      ok: true,
      alreadyConfirmed: true,
      review: buildStatus(dossier),
    });
  }

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType:
        DOSSIER_KYC_REVIEW_CONFIRMED_EVENT,
      fromState: "KYC_REVIEW",
      toState: "KYC_REVIEW",
      message:
        "Operator confirmed KYC, party identity, authority, and source-context review threshold for SPA drafting.",
      actor: principal.email,
      metadata: {
        source:
          "control-center.kyc-review",
        disposition:
          "READY_FOR_SPA_DRAFTING",
        note:
          typeof body.note === "string" &&
          body.note.trim()
            ? body.note.trim()
            : null,
        readinessChecks:
          readiness.checks,
        doctrine: {
          reviewForDraftingIsNotFinalCompliance:
            true,
          draftingAuthorityIsNotExecutionAuthority:
            true,
        },
      },
    },
  });

  const updated =
    await loadKycContext(id);

  if (!updated) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "DOSSIER_NOT_FOUND_AFTER_KYC_REVIEW",
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyConfirmed: false,
    review: buildStatus(updated),
  });
}
