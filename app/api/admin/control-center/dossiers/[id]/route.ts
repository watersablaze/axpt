import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";
import { getAvailableDossierTransitions } from "@/domains/control-center/getAvailableDossierTransitions";
import {
  getExecutionProfileLabel,
  inferDossierExecutionProfile,
} from "@/domains/control-center/inferDossierExecutionProfile";

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

              submitterName: true,
              submitterEmail: true,
              submitterPhone: true,
              submitterCompany: true,
              submitterCountry: true,
              submitterRole: true,

              representedPartyType: true,
              representedPartyName: true,
              authorizationStatus: true,

              transactionType: true,
              commodity: true,
              quantity: true,
              origin: true,
              destination: true,
              deliveryTerms: true,
              settlementMethod: true,
              expectedTimeline: true,
              buyerName: true,
              sellerName: true,
              refineryPreference: true,
              financialReadiness: true,
              documentsAvailable: true,

              buyerRegistrationNumber: true,
              buyerCountryOfIncorporation: true,
              buyerRegisteredAddress: true,
              buyerBusinessAddress: true,
              buyerCorporateEmail: true,
              buyerCorporatePhone: true,

              buyerRepresentativeName: true,
              buyerRepresentativeTitle: true,
              buyerRepresentativeEntity: true,
              buyerRepresentativeEmail: true,
              buyerRepresentativePhone: true,
              buyerRepresentativeRelationship: true,

              authorityToRepresent: true,
              authorityToNegotiate: true,
              authorityToSign: true,
              authorityOther: true,

              requestedPurity: true,
              transactionPurpose: true,
              transactionWindow: true,
              continuingSupplyIntent: true,
              recurringQuantity: true,
              recurringFrequency: true,
              desiredTerm: true,
              destinationStatus: true,
              buyerRequirements: true,

              deliveryPathway: true,
              deliveryPoint: true,
              buyerRepresentativesPresent: true,
              buyerRepresentative1: true,
              buyerRepresentative2: true,
              refineryJurisdiction: true,
              assayPosture: true,
              additionalAssayRequirements: true,

              settlementPathway: true,
              settlementRail: true,
              settlementCurrencyAsset: true,
              settlementTimingRequirement: true,
              bankMessageFormat: true,
              digitalAsset: true,
              digitalAssetNetwork: true,
              additionalSettlementAuthorityRequired: true,
              additionalSettlementAuthorityDetail: true,
              financialCapacityStatus: true,

              incorporationRecordAvailable: true,
              kybRecordAvailable: true,
              representativeIdAvailable: true,
              authorityDocumentAvailable: true,
              specialComplianceRequirements: true,
              specialComplianceDetail: true,

              authorizedSubmitterEntity: true,
              authorizedSubmitterRepresentative: true,
              authorizedSubmitterPosition: true,
              authorizedSubmissionDate: true,

              referralCode: true,
              referredByName: true,
              referredByCompany: true,

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

  const sourceTransactionType =
    dossier.promotedOpportunities[0]?.sourceTransactionIntake
      ?.transactionType ?? null;

  const executionProfile = inferDossierExecutionProfile({
    settlement: dossier.settlement,
    transactionType: sourceTransactionType,
    terms: dossier.terms,
  });

  const availableTransitions = getAvailableDossierTransitions({
    state: dossier.state,
    settlement: dossier.settlement,
    transactionType: sourceTransactionType,
    terms: dossier.terms,
  });

  const nextStates = availableTransitions.map(
    (transition) => transition.toState,
  );

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
      executionProfile,
      executionProfileLabel: getExecutionProfileLabel(executionProfile),
      availableTransitions,
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
                submitterPhone:
                  opportunity.sourceTransactionIntake.submitterPhone,
                submitterCompany:
                  opportunity.sourceTransactionIntake.submitterCompany,
                submitterCountry:
                  opportunity.sourceTransactionIntake.submitterCountry,
                submitterRole:
                  opportunity.sourceTransactionIntake.submitterRole,

                representedPartyType:
                  opportunity.sourceTransactionIntake.representedPartyType,
                representedPartyName:
                  opportunity.sourceTransactionIntake.representedPartyName,
                authorizationStatus:
                  opportunity.sourceTransactionIntake.authorizationStatus,

                transactionType:
                  opportunity.sourceTransactionIntake.transactionType,
                commodity:
                  opportunity.sourceTransactionIntake.commodity,
                quantity:
                  opportunity.sourceTransactionIntake.quantity,
                origin:
                  opportunity.sourceTransactionIntake.origin,
                destination:
                  opportunity.sourceTransactionIntake.destination,
                deliveryTerms:
                  opportunity.sourceTransactionIntake.deliveryTerms,
                settlementMethod:
                  opportunity.sourceTransactionIntake.settlementMethod,
                expectedTimeline:
                  opportunity.sourceTransactionIntake.expectedTimeline,
                buyerName:
                  opportunity.sourceTransactionIntake.buyerName,
                sellerName:
                  opportunity.sourceTransactionIntake.sellerName,
                refineryPreference:
                  opportunity.sourceTransactionIntake.refineryPreference,
                financialReadiness:
                  opportunity.sourceTransactionIntake.financialReadiness,
                documentsAvailable:
                  opportunity.sourceTransactionIntake.documentsAvailable,

                buyerRegistrationNumber:
                  opportunity.sourceTransactionIntake.buyerRegistrationNumber,
                buyerCountryOfIncorporation:
                  opportunity.sourceTransactionIntake
                    .buyerCountryOfIncorporation,
                buyerRegisteredAddress:
                  opportunity.sourceTransactionIntake.buyerRegisteredAddress,
                buyerBusinessAddress:
                  opportunity.sourceTransactionIntake.buyerBusinessAddress,
                buyerCorporateEmail:
                  opportunity.sourceTransactionIntake.buyerCorporateEmail,
                buyerCorporatePhone:
                  opportunity.sourceTransactionIntake.buyerCorporatePhone,

                buyerRepresentativeName:
                  opportunity.sourceTransactionIntake.buyerRepresentativeName,
                buyerRepresentativeTitle:
                  opportunity.sourceTransactionIntake.buyerRepresentativeTitle,
                buyerRepresentativeEntity:
                  opportunity.sourceTransactionIntake
                    .buyerRepresentativeEntity,
                buyerRepresentativeEmail:
                  opportunity.sourceTransactionIntake.buyerRepresentativeEmail,
                buyerRepresentativePhone:
                  opportunity.sourceTransactionIntake.buyerRepresentativePhone,
                buyerRepresentativeRelationship:
                  opportunity.sourceTransactionIntake
                    .buyerRepresentativeRelationship,

                authorityToRepresent:
                  opportunity.sourceTransactionIntake.authorityToRepresent,
                authorityToNegotiate:
                  opportunity.sourceTransactionIntake.authorityToNegotiate,
                authorityToSign:
                  opportunity.sourceTransactionIntake.authorityToSign,
                authorityOther:
                  opportunity.sourceTransactionIntake.authorityOther,

                requestedPurity:
                  opportunity.sourceTransactionIntake.requestedPurity,
                transactionPurpose:
                  opportunity.sourceTransactionIntake.transactionPurpose,
                transactionWindow:
                  opportunity.sourceTransactionIntake.transactionWindow,
                continuingSupplyIntent:
                  opportunity.sourceTransactionIntake.continuingSupplyIntent,
                recurringQuantity:
                  opportunity.sourceTransactionIntake.recurringQuantity,
                recurringFrequency:
                  opportunity.sourceTransactionIntake.recurringFrequency,
                desiredTerm:
                  opportunity.sourceTransactionIntake.desiredTerm,
                destinationStatus:
                  opportunity.sourceTransactionIntake.destinationStatus,
                buyerRequirements:
                  opportunity.sourceTransactionIntake.buyerRequirements,

                deliveryPathway:
                  opportunity.sourceTransactionIntake.deliveryPathway,
                deliveryPoint:
                  opportunity.sourceTransactionIntake.deliveryPoint,
                buyerRepresentativesPresent:
                  opportunity.sourceTransactionIntake
                    .buyerRepresentativesPresent,
                buyerRepresentative1:
                  opportunity.sourceTransactionIntake.buyerRepresentative1,
                buyerRepresentative2:
                  opportunity.sourceTransactionIntake.buyerRepresentative2,
                refineryJurisdiction:
                  opportunity.sourceTransactionIntake.refineryJurisdiction,
                assayPosture:
                  opportunity.sourceTransactionIntake.assayPosture,
                additionalAssayRequirements:
                  opportunity.sourceTransactionIntake
                    .additionalAssayRequirements,

                settlementPathway:
                  opportunity.sourceTransactionIntake.settlementPathway,
                settlementRail:
                  opportunity.sourceTransactionIntake.settlementRail,
                settlementCurrencyAsset:
                  opportunity.sourceTransactionIntake
                    .settlementCurrencyAsset,
                settlementTimingRequirement:
                  opportunity.sourceTransactionIntake
                    .settlementTimingRequirement,
                bankMessageFormat:
                  opportunity.sourceTransactionIntake.bankMessageFormat,
                digitalAsset:
                  opportunity.sourceTransactionIntake.digitalAsset,
                digitalAssetNetwork:
                  opportunity.sourceTransactionIntake.digitalAssetNetwork,
                additionalSettlementAuthorityRequired:
                  opportunity.sourceTransactionIntake
                    .additionalSettlementAuthorityRequired,
                additionalSettlementAuthorityDetail:
                  opportunity.sourceTransactionIntake
                    .additionalSettlementAuthorityDetail,
                financialCapacityStatus:
                  opportunity.sourceTransactionIntake.financialCapacityStatus,

                incorporationRecordAvailable:
                  opportunity.sourceTransactionIntake
                    .incorporationRecordAvailable,
                kybRecordAvailable:
                  opportunity.sourceTransactionIntake.kybRecordAvailable,
                representativeIdAvailable:
                  opportunity.sourceTransactionIntake
                    .representativeIdAvailable,
                authorityDocumentAvailable:
                  opportunity.sourceTransactionIntake
                    .authorityDocumentAvailable,
                specialComplianceRequirements:
                  opportunity.sourceTransactionIntake
                    .specialComplianceRequirements,
                specialComplianceDetail:
                  opportunity.sourceTransactionIntake.specialComplianceDetail,

                authorizedSubmitterEntity:
                  opportunity.sourceTransactionIntake
                    .authorizedSubmitterEntity,
                authorizedSubmitterRepresentative:
                  opportunity.sourceTransactionIntake
                    .authorizedSubmitterRepresentative,
                authorizedSubmitterPosition:
                  opportunity.sourceTransactionIntake
                    .authorizedSubmitterPosition,
                authorizedSubmissionDate:
                  opportunity.sourceTransactionIntake
                    .authorizedSubmissionDate,

                promotedAt:
                  opportunity.sourceTransactionIntake.promotedAt?.toISOString() ??
                  null,
                promotedBy:
                  opportunity.sourceTransactionIntake.promotedBy,
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

type DossierPatchBody = {
  origin?: string | null;
  refinery?: string | null;
  settlement?: string | null;
};

function normalizePatchValue(value: string | null | undefined) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(req: Request, context: RouteContext) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as DossierPatchBody;

  const data: DossierPatchBody = {};

  if ("origin" in body) {
    data.origin = normalizePatchValue(body.origin);
  }

  if ("refinery" in body) {
    data.refinery = normalizePatchValue(body.refinery);
  }

  if ("settlement" in body) {
    data.settlement = normalizePatchValue(body.settlement);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { ok: false, error: "NO_DOSSIER_FIELDS_TO_UPDATE" },
      { status: 400 },
    );
  }

  const dossier = await prisma.transactionDossier.update({
    where: { id },
    data,
  });

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType: "DOSSIER_SOURCE_CONTEXT_UPDATED",
      fromState: null,
      toState: null,
      message: `${principal.email} updated dossier source context.`,
      actor: principal.email,
      metadata: {
        source: "control-center.dossier-source-context",
        updatedFields: Object.keys(data),
      },
    },
  });

  return NextResponse.json({
    ok: true,
    dossier,
  });
}
