import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";

import { canTransitionDossier } from "@/domains/control-center/dossierStateMachine";
import { getAvailableDossierTransitions } from "@/domains/control-center/getAvailableDossierTransitions";

import { checkDossierArtifactGate } from "@/domains/control-center/dossierArtifactGates";

import { checkDossierApprovalGate } from "@/domains/control-center/dossierApprovalGates";

import { getTransitionConsequences } from "@/domains/control-center/transitionConsequences";
import { inferDossierExecutionProfile } from "@/domains/control-center/inferDossierExecutionProfile";

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
      terms: true,
      parties: true,
      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
      promotedOpportunities: {
        select: {
          id: true,
          source: true,
          title: true,
          sourceTransactionIntake: {
            select: {
              transactionType: true,
            },
          },
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

  const sourceTransactionType =
    dossier.promotedOpportunities[0]?.sourceTransactionIntake
      ?.transactionType ?? null;

  const executionProfile = inferDossierExecutionProfile({
    settlement: dossier.settlement,
    transactionType: sourceTransactionType,
    terms: dossier.terms,
  });

  const fromState = dossier.state;
  const toState = body.toState;

  const stateMachinePassed = canTransitionDossier(fromState, toState);

  const availableTransitions = getAvailableDossierTransitions({
    state: fromState,
    settlement: dossier.settlement,
    transactionType: sourceTransactionType,
    terms: dossier.terms,
  });

  const profilePassed = availableTransitions.some(
    (transition) => transition.toState === toState,
  );

  const artifactGate =
    stateMachinePassed && profilePassed
    ? checkDossierArtifactGate({
        fromState,
        toState,
        instruments: dossier.instruments,
        parties: dossier.parties,
        sourceOpportunities: dossier.promotedOpportunities,
        events: dossier.events,
        origin: dossier.origin,
        settlement: dossier.settlement,
        executionProfile,
      })
    : {
        passed: false,
        blockingReason: !stateMachinePassed
          ? "Requested transition is not allowed by the dossier state machine."
          : "Requested transition is not available for the dossier execution profile.",
        checks: [
          {
            id: !stateMachinePassed
              ? "state-machine"
              : "execution-profile",
            label: !stateMachinePassed
              ? "Valid state transition"
              : "Execution profile allows transition",
            passed: false,
            detail: !stateMachinePassed
              ? `${fromState} cannot transition to ${toState}.`
              : `${toState} is not available for execution profile ${executionProfile}.`,
          },
        ],
      };

  const approvalGate =
    stateMachinePassed && profilePassed
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
    stateMachinePassed &&
    profilePassed &&
    artifactGate.passed &&
    approvalGate.passed;

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
      profileGate: {
        passed: profilePassed,
        profile: executionProfile,
        availableStates: availableTransitions.map(
          (transition) => transition.toState,
        ),
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
