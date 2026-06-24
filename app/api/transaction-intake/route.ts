import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { createTransactionIntakeReference } from "../../../lib/intakeReference";
import { sendTransactionIntakeConfirmation } from "@/domains/control-center/transaction-intakes/sendTransactionIntakeConfirmation";

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
