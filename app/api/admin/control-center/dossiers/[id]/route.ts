import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const DOSSIER_TRANSITION_MAP: Record<string, string[]> = {
  INTAKE_PENDING: ["KYC_REVIEW"],
  KYC_REVIEW: ["SPA_DRAFTING", "BLOCKED", "CANCELLED"],
  SPA_DRAFTING: ["SPA_EXECUTED", "BLOCKED", "CANCELLED"],
  SPA_EXECUTED: ["ESCROW_PENDING"],
  ESCROW_PENDING: ["ESCROW_FUNDED", "BLOCKED", "CANCELLED"],
  ESCROW_FUNDED: ["TREASURY_PENDING"],
  TREASURY_PENDING: ["EXPORT_RELEASED"],
  EXPORT_RELEASED: ["EXPORT_ACTIVE"],
  EXPORT_ACTIVE: ["IN_TRANSIT"],
  IN_TRANSIT: ["REFINERY_INTAKE"],
  REFINERY_INTAKE: ["REFINERY_ASSAY"],
  REFINERY_ASSAY: ["ASSAY_PENDING"],
  ASSAY_PENDING: ["SETTLEMENT_PENDING"],
  SETTLEMENT_PENDING: ["SETTLED"],
  SETTLED: ["CLOSED"],
};

function getNextDossierStates(state: string): string[] {
  return DOSSIER_TRANSITION_MAP[state] ?? [];
}

export async function GET(_request: Request, context: RouteContext) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const dossier = await prisma.transactionDossier.findUnique({
    where: { id },
    include: {
      parties: true,
      terms: true,
      instruments: true,
      promotedOpportunities: {
        include: {
          sourceTransactionIntake: {
            select: {
              id: true,
              reference: true,
              referralCode: true,
              referredByName: true,
              referredByCompany: true,
              submitterName: true,
              submitterEmail: true,
              promotedAt: true,
              promotedBy: true,
            },
          },
        },
      },
      approvalRequirements: {
        include: {
          approvals: true,
        },
      },
      events: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: "DOSSIER_NOT_FOUND" },
      { status: 404 },
    );
  }

  const nextStates = getNextDossierStates(dossier.state);

  const transitionCount = dossier.events.filter(
    (event: (typeof dossier.events)[number]) =>
      event.eventType === "DOSSIER_STATE_TRANSITIONED",
  ).length;

  const executedInstrumentCount = dossier.instruments.filter(
    (instrument: (typeof dossier.instruments)[number]) =>
      instrument.status === "EXECUTED",
  ).length;

  const pendingApprovalCount = dossier.approvalRequirements.filter(
    (requirement: (typeof dossier.approvalRequirements)[number]) =>
      requirement.status !== "SATISFIED",
  ).length;

  return NextResponse.json({
    ok: true,
    dossier: {
      id: dossier.id,
      reference: dossier.reference,
      title: dossier.title,
      state: dossier.state,
      commodity: dossier.commodity,
      origin: dossier.origin,
      quantityKg: dossier.quantityKg?.toString() ?? null,
      refinery: dossier.refinery,
      settlement: dossier.settlement,
      terms: dossier.terms
        ? {
            settlementMethod: dossier.terms.settlementMethod,
            financialInstrumentType: dossier.terms.financialInstrumentType,
            issuingInstitution: dossier.terms.issuingInstitution,
            instrumentAmountOrCoverage:
              dossier.terms.instrumentAmountOrCoverage,
            validityPeriod: dossier.terms.validityPeriod,
            paymentTrigger: dossier.terms.paymentTrigger,
            beneficiary: dossier.terms.beneficiary,
            sellerSideCompensation: dossier.terms.sellerSideCompensation,
            buyerSideCompensation: dossier.terms.buyerSideCompensation,
            compensationPayer: dossier.terms.compensationPayer,
            compensationPayees: dossier.terms.compensationPayees,
            compensationPayoutTrigger: dossier.terms.compensationPayoutTrigger,
            compensationPaymentMethod: dossier.terms.compensationPaymentMethod,
            compensationAuthorizationStatus:
              dossier.terms.compensationAuthorizationStatus,
            compensationConfidentialityNote:
              dossier.terms.compensationConfidentialityNote,
          }
        : null,

      nextStates,
      transitionCount,
      executedInstrumentCount,
      pendingApprovalCount,

      sourceOpportunities: dossier.promotedOpportunities.map(
        (opportunity: (typeof dossier.promotedOpportunities)[number]) => ({
          id: opportunity.id,
          title: opportunity.title,
          source: opportunity.source,
          status: opportunity.status,
          sourceIntake: opportunity.sourceTransactionIntake
            ? {
                id: opportunity.sourceTransactionIntake.id,
                reference: opportunity.sourceTransactionIntake.reference,
                referralCode: opportunity.sourceTransactionIntake.referralCode,
                referredByName:
                  opportunity.sourceTransactionIntake.referredByName,
                referredByCompany:
                  opportunity.sourceTransactionIntake.referredByCompany,
                submitterName:
                  opportunity.sourceTransactionIntake.submitterName,
                submitterEmail:
                  opportunity.sourceTransactionIntake.submitterEmail,
                promotedAt:
                  opportunity.sourceTransactionIntake.promotedAt?.toISOString() ??
                  null,
                promotedBy: opportunity.sourceTransactionIntake.promotedBy,
              }
            : null,
        }),
      ),

      parties: dossier.parties,
      instruments: dossier.instruments,
      approvalRequirements: dossier.approvalRequirements,
      events: dossier.events.map((event: (typeof dossier.events)[number]) => ({
        ...event,
        createdAt: event.createdAt.toISOString(),
      })),
    },
  });
}
