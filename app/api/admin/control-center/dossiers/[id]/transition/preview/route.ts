import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";

import { canTransitionDossier } from "@/domains/control-center/dossierStateMachine";

import { checkDossierArtifactGate } from "@/domains/control-center/dossierArtifactGates";

import { checkDossierApprovalGate } from "@/domains/control-center/dossierApprovalGates";

import { getTransitionConsequences } from "@/domains/control-center/transitionConsequences";

type PreviewBody = {
  toState?: string;
};

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as PreviewBody;

  if (!body.toState) {
    return NextResponse.json(
      { ok: false, error: "MISSING_TO_STATE" },
      { status: 400 },
    );
  }

  const dossier = await prisma.transactionDossier.findUnique({
    where: { id },
    include: {
      instruments: true,
      approvalRequirements: true,
      parties: true,
      promotedOpportunities: {
        select: {
          id: true,
          source: true,
          title: true,
        },
      },
    },
  });

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: "DOSSIER_NOT_FOUND" },
      { status: 404 },
    );
  }

  const fromState = dossier.state;
  const toState = body.toState;

  const stateMachinePassed = canTransitionDossier(fromState, toState);

  const artifactGate = stateMachinePassed
    ? checkDossierArtifactGate({
        fromState,
        toState,
        instruments: dossier.instruments,
        parties: dossier.parties,
        sourceOpportunities: dossier.promotedOpportunities,
        origin: dossier.origin,
      })
    : {
        passed: false,
        blockingReason:
          "Requested transition is not allowed by the dossier state machine.",
        checks: [
          {
            id: "state-machine",
            label: "Valid state transition",
            passed: false,
            detail: `${fromState} cannot transition to ${toState}.`,
          },
        ],
      };

  const approvalGate = stateMachinePassed
    ? checkDossierApprovalGate({
        fromState,
        toState,
        operatorRoles: principal.roles,
        requirements: dossier.approvalRequirements,
      })
    : {
        passed: false,
        blockingReason:
          "Approval gate not evaluated because state transition is invalid.",
        checks: [
          {
            id: "approval-skipped",
            label: "Approval gate skipped",
            passed: false,
            detail: "Approval checks only run for valid state transitions.",
          },
        ],
      };

  const executable =
    stateMachinePassed && artifactGate.passed && approvalGate.passed;

  return NextResponse.json({
    ok: true,
    preview: {
      dossierId: dossier.id,
      reference: dossier.reference,
      fromState,
      toState,
      executable,
      stateMachine: {
        passed: stateMachinePassed,
      },
      artifactGate,
      approvalGate,
      consequences: stateMachinePassed
        ? getTransitionConsequences({
            fromState,
            toState,
          })
        : [],
    },
  });
}
