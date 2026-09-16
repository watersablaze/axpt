import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { createTransactionIntakeReference } from "../../../lib/intakeReference";
import { sendTransactionIntakeConfirmation } from "@/domains/control-center/transaction-intakes/sendTransactionIntakeConfirmation";
import { sendTransactionIntakeInternalNotification } from "@/domains/control-center/transaction-intakes/sendTransactionIntakeInternalNotification";

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const submitterName = asRequiredString(body.submitterName);
    const submitterEmail = asRequiredString(body.submitterEmail);
    const submitterRole = asRequiredString(body.submitterRole);

    if (!submitterName || !submitterEmail || !submitterRole) {
      return NextResponse.json(
        {
          ok: false,
          error: "Submitter name, email, and role are required.",
        },
        { status: 400 },
      );
    }

    if (
      body.declarationAccuracy !== true ||
      body.declarationNoObligation !== true ||
      body.declarationNoCommission !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "All required submission declarations must be confirmed.",
        },
        { status: 400 },
      );
    }

    const reference = createTransactionIntakeReference();

    const intake = await prisma.transactionIntake.create({
      data: {
        reference,

        submitterName,
        submitterEmail,
        submitterRole,

        submitterPhone: asOptionalString(body.submitterPhone),
        submitterCompany: asOptionalString(body.submitterCompany),
        submitterCountry: asOptionalString(body.submitterCountry),

        representedPartyType: asOptionalString(body.representedPartyType),
        representedPartyName: asOptionalString(body.representedPartyName),
        authorizationStatus: asOptionalString(body.authorizationStatus),

        program: asOptionalString(body.program),
        transactionType: asOptionalString(body.transactionType),
        commodity: asOptionalString(body.commodity),
        quantity: asOptionalString(body.quantity),
        trialQuantity: asOptionalString(body.trialQuantity),
        monthlyQuantity: asOptionalString(body.monthlyQuantity),
        origin: asOptionalString(body.origin),
        destination: asOptionalString(body.destination),
        deliveryTerms: asOptionalString(body.deliveryTerms),
        settlementMethod: asOptionalString(body.settlementMethod),
        expectedTimeline: asOptionalString(body.expectedTimeline),

        buyerName: asOptionalString(body.buyerName),
        sellerName: asOptionalString(body.sellerName),
        refineryPreference: asOptionalString(body.refineryPreference),
        financialReadiness: asOptionalString(body.financialReadiness),
        documentsAvailable: asOptionalString(body.documentsAvailable),
        supportingNotes: asOptionalString(body.supportingNotes),

        // LOI V4 — Counterparty Identity / Authority
        buyerRegistrationNumber: asOptionalString(
          body.buyerRegistrationNumber,
        ),
        buyerCountryOfIncorporation: asOptionalString(
          body.buyerCountryOfIncorporation,
        ),
        buyerRegisteredAddress: asOptionalString(
          body.buyerRegisteredAddress,
        ),
        buyerBusinessAddress: asOptionalString(
          body.buyerBusinessAddress,
        ),
        buyerCorporateEmail: asOptionalString(
          body.buyerCorporateEmail,
        ),
        buyerCorporatePhone: asOptionalString(
          body.buyerCorporatePhone,
        ),

        buyerRepresentativeName: asOptionalString(
          body.buyerRepresentativeName,
        ),
        buyerRepresentativeTitle: asOptionalString(
          body.buyerRepresentativeTitle,
        ),
        buyerRepresentativeEntity: asOptionalString(
          body.buyerRepresentativeEntity,
        ),
        buyerRepresentativeEmail: asOptionalString(
          body.buyerRepresentativeEmail,
        ),
        buyerRepresentativePhone: asOptionalString(
          body.buyerRepresentativePhone,
        ),
        buyerRepresentativeRelationship: asOptionalString(
          body.buyerRepresentativeRelationship,
        ),

        authorityToRepresent: Boolean(body.authorityToRepresent),
        authorityToNegotiate: Boolean(body.authorityToNegotiate),
        authorityToSign: Boolean(body.authorityToSign),
        authorityOther: asOptionalString(body.authorityOther),

        externalParticipants: Array.isArray(body.externalParticipants)
          ? body.externalParticipants
          : undefined,

        // LOI V4 — Transaction Profile
        requestedPurity: asOptionalString(body.requestedPurity),
        transactionPurpose: asOptionalString(body.transactionPurpose),
        transactionWindow: asOptionalString(body.transactionWindow),
        continuingSupplyIntent: asOptionalString(
          body.continuingSupplyIntent,
        ),
        recurringQuantity: asOptionalString(body.recurringQuantity),
        recurringFrequency: asOptionalString(body.recurringFrequency),
        desiredTerm: asOptionalString(body.desiredTerm),
        destinationStatus: asOptionalString(body.destinationStatus),
        buyerRequirements: asOptionalString(body.buyerRequirements),

        // LOI V4 — Delivery / Assay
        deliveryPathway: asOptionalString(body.deliveryPathway),
        deliveryPoint: asOptionalString(body.deliveryPoint),
        buyerRepresentativesPresent: asOptionalString(
          body.buyerRepresentativesPresent,
        ),
        buyerRepresentative1: asOptionalString(
          body.buyerRepresentative1,
        ),
        buyerRepresentative2: asOptionalString(
          body.buyerRepresentative2,
        ),
        refineryJurisdiction: asOptionalString(
          body.refineryJurisdiction,
        ),
        assayPosture: asOptionalString(body.assayPosture),
        additionalAssayRequirements: asOptionalString(
          body.additionalAssayRequirements,
        ),

        // LOI V4 — Settlement
        settlementPathway: asOptionalString(body.settlementPathway),
        settlementRail: asOptionalString(body.settlementRail),
        settlementCurrencyAsset: asOptionalString(
          body.settlementCurrencyAsset,
        ),
        settlementTimingRequirement: asOptionalString(
          body.settlementTimingRequirement,
        ),
        bankMessageFormat: asOptionalString(body.bankMessageFormat),
        digitalAsset: asOptionalString(body.digitalAsset),
        digitalAssetNetwork: asOptionalString(
          body.digitalAssetNetwork,
        ),
        additionalSettlementAuthorityRequired: asOptionalString(
          body.additionalSettlementAuthorityRequired,
        ),
        additionalSettlementAuthorityDetail: asOptionalString(
          body.additionalSettlementAuthorityDetail,
        ),
        financialCapacityStatus: asOptionalString(
          body.financialCapacityStatus,
        ),

        // LOI V4 — Readiness / Compliance
        incorporationRecordAvailable: Boolean(
          body.incorporationRecordAvailable,
        ),
        kybRecordAvailable: Boolean(body.kybRecordAvailable),
        representativeIdAvailable: Boolean(
          body.representativeIdAvailable,
        ),
        authorityDocumentAvailable: Boolean(
          body.authorityDocumentAvailable,
        ),

        specialComplianceRequirements: asOptionalString(
          body.specialComplianceRequirements,
        ),
        specialComplianceDetail: asOptionalString(
          body.specialComplianceDetail,
        ),

        // LOI V4 — Authorized Submission
        authorizedSubmitterEntity: asOptionalString(
          body.authorizedSubmitterEntity,
        ),
        authorizedSubmitterRepresentative: asOptionalString(
          body.authorizedSubmitterRepresentative,
        ),
        authorizedSubmitterPosition: asOptionalString(
          body.authorizedSubmitterPosition,
        ),
        authorizedSubmissionDate: asOptionalString(
          body.authorizedSubmissionDate,
        ),

        referralCode: asOptionalString(body.referralCode),
        referredByName: asOptionalString(body.referredByName),
        referredByCompany: asOptionalString(body.referredByCompany),
        referredByEmail: asOptionalString(body.referredByEmail),
        referredByPhone: asOptionalString(body.referredByPhone),
        referredByRole: asOptionalString(body.referredByRole),
        referralConfirmed: Boolean(body.referralConfirmed),
        compensationExpectation: asOptionalString(body.compensationExpectation),

        declarationAccuracy: Boolean(body.declarationAccuracy),
        declarationNoObligation: Boolean(body.declarationNoObligation),
        declarationNoCommission: Boolean(body.declarationNoCommission),

        sourceUrl: asOptionalString(body.sourceUrl),
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    await sendTransactionIntakeConfirmation({
      id: intake.id,
      reference: intake.reference,
      submitterName: intake.submitterName,
      submitterEmail: intake.submitterEmail,
      program: intake.program,
      transactionType: intake.transactionType,
      commodity: intake.commodity,
      quantity: intake.quantity,
      trialQuantity: intake.trialQuantity,
      monthlyQuantity: intake.monthlyQuantity,
      destination: intake.destination,
      referralCode: intake.referralCode,
      referredByName: intake.referredByName,
    }).catch((error) => {
      console.error("[transaction-intake:confirmation-email]", error);
    });

    await sendTransactionIntakeInternalNotification({
      id: intake.id,
      reference: intake.reference,
      submitterName: intake.submitterName,
      submitterEmail: intake.submitterEmail,
      submitterPhone: intake.submitterPhone,
      submitterCompany: intake.submitterCompany,
      submitterRole: intake.submitterRole,
      buyerName: intake.buyerName,
      program: intake.program,
      transactionType: intake.transactionType,
      commodity: intake.commodity,
      quantity: intake.quantity,
      trialQuantity: intake.trialQuantity,
      monthlyQuantity: intake.monthlyQuantity,
      origin: intake.origin,
      destination: intake.destination,
      deliveryTerms: intake.deliveryTerms,
      settlementMethod: intake.settlementMethod,
      referralCode: intake.referralCode,
      referredByName: intake.referredByName,
    }).catch((error) => {
      console.error("[transaction-intake:internal-notification]", error);
    });

    return NextResponse.json({
      ok: true,
      intake: {
        id: intake.id,
        reference: intake.reference,
        status: intake.status,
      },
    });
  } catch (error) {
    console.error("[transaction-intake:create]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Unable to submit transaction intake.",
      },
      { status: 500 },
    );
  }
}
