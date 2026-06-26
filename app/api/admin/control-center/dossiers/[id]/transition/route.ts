import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { appendDomainEvent } from "@/core/events/appendDomainEvent";
import { EventTypes } from "@/core/events/types";

import { canTransitionDossier } from "@/domains/control-center/dossierStateMachine";

import { checkDossierArtifactGate } from "@/domains/control-center/dossierArtifactGates";

import { orchestrateDossierTransition } from "@/domains/control-center/orchestrateDossierTransition";

import { checkDossierApprovalGate } from "@/domains/control-center/dossierApprovalGates";

import { generateTransitionArtifacts } from "@/domains/control-center/generateTransitionArtifacts";

import { buildTransitionAuditRecord } from "@/domains/control-center/buildTransitionAuditRecord";

import { getTransitionConsequences } from "@/domains/control-center/transitionConsequences";
import { inferDossierExecutionProfile } from "@/domains/control-center/inferDossierExecutionProfile";

type DossierTransitionBody = {
  toState?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export async function PATCH(
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
  const body = (await req.json()) as DossierTransitionBody;

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

  const executionProfile = inferDossierExecutionProfile({
    settlement: dossier.settlement,
    transactionType: null,
    terms: dossier.terms,
  });

  const fromState = dossier.state;
  const toState = body.toState as typeof dossier.state;

  if (!canTransitionDossier(fromState, toState)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_DOSSIER_TRANSITION",
        fromState,
        toState,
      },
      { status: 400 },
    );
  }

  const artifactGate = checkDossierArtifactGate({
    fromState,
    toState,
    instruments: dossier.instruments,
    parties: dossier.parties,
    sourceOpportunities: dossier.promotedOpportunities,
    origin: dossier.origin,
    settlement: dossier.settlement,
    executionProfile,
  });

  if (!artifactGate.passed) {
    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_ARTIFACT_GATE_BLOCKED",
        reason: artifactGate.blockingReason,
        fromState,
        toState,
        checks: artifactGate.checks,
      },
      { status: 409 },
    );
  }

  const approvalGate = checkDossierApprovalGate({
    fromState,
    toState,
    operatorRoles: principal.roles,
    requirements: dossier.approvalRequirements,
  });

  if (!approvalGate.passed) {
    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_APPROVAL_GATE_BLOCKED",
        reason: approvalGate.blockingReason,
        fromState,
        toState,
        checks: approvalGate.checks,
      },
      { status: 403 },
    );
  }

  const message =
    body.message ?? `Dossier transitioned from ${fromState} to ${toState}.`;

  try {
    const orchestration = await orchestrateDossierTransition({
      dossier,
      fromState,
      toState,
      principal,
    });

    const updated = await prisma.transactionDossier.update({
      where: { id },
      data: {
        state: toState,
      },
    });

    const generatedArtifacts = await generateTransitionArtifacts({
      dossierId: dossier.id,
      reference: dossier.reference,
      fromState,
      toState,
      operatorEmail: principal.email,
    });

    const transitionConsequences = getTransitionConsequences({
      fromState,
      toState,
    });

    const transitionAuditRecord = buildTransitionAuditRecord({
      dossierId: dossier.id,
      reference: dossier.reference,
      fromState,
      toState,
      operatorEmail: principal.email,
      approvals: dossier.approvalRequirements,
      generatedArtifacts: generatedArtifacts.map((artifact) => ({
        type: artifact.instrument.type,
        title: artifact.instrument.title,
        status: artifact.instrument.status,
        version: artifact.instrument.version,
      })),
      consequences: transitionConsequences,
    });

    const event = await prisma.transactionDossierEvent.create({
      data: {
        dossierId: dossier.id,
        eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
        fromState,
        toState,
        message,
        actor: principal.email,
        metadata: {
          source: "control-center.transition",
          operatorId: null,
          operatorEmail: principal.email,
          transitionAuditRecord,
          ...(body.metadata ?? {}),
        },
      },
    });

    await appendDomainEvent({
      streamType: "DOSSIER",
      streamId: dossier.reference,
      eventType: EventTypes.DOSSIER_STATE_TRANSITIONED,
      payload: {
        dossierId: dossier.id,
        reference: dossier.reference,
        fromState,
        toState,
        message,
      },
      metadata: {
        source: "dossier.transition",
        operatorId: null,
        operatorEmail: principal.email,
        dossierId: dossier.id,
        reference: dossier.reference,
      },
    });

    return NextResponse.json({
      ok: true,
      dossier: updated,
      event,
      orchestration,
      generatedArtifacts,
    });
  } catch (err) {
    console.error("[DOSSIER_TRANSITION_FAILED]", err);

    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_TRANSITION_FAILED",
      },
      { status: 500 },
    );
  }
}
