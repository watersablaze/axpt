import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type TermsBody = {
  settlementMethod?: string | null;
  financialInstrumentType?: string | null;
  issuingInstitution?: string | null;
  instrumentAmountOrCoverage?: string | null;
  validityPeriod?: string | null;
  paymentTrigger?: string | null;
  beneficiary?: string | null;

  sellerSideCompensation?: string | null;
  buyerSideCompensation?: string | null;
  compensationPayer?: string | null;
  compensationPayees?: string | null;
  compensationPayoutTrigger?: string | null;
  compensationPaymentMethod?: string | null;
  compensationAuthorizationStatus?: string | null;
  compensationConfidentialityNote?: string | null;
};

const EMPTY_TERMS: TermsBody = {
  settlementMethod: null,
  financialInstrumentType: null,
  issuingInstitution: null,
  instrumentAmountOrCoverage: null,
  validityPeriod: null,
  paymentTrigger: null,
  beneficiary: null,

  sellerSideCompensation: null,
  buyerSideCompensation: null,
  compensationPayer: null,
  compensationPayees: null,
  compensationPayoutTrigger: null,
  compensationPaymentMethod: null,
  compensationAuthorizationStatus: null,
  compensationConfidentialityNote: null,
};

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTermsBody(body: TermsBody) {
  return {
    settlementMethod: normalizeOptionalText(body.settlementMethod),
    financialInstrumentType: normalizeOptionalText(
      body.financialInstrumentType,
    ),
    issuingInstitution: normalizeOptionalText(body.issuingInstitution),
    instrumentAmountOrCoverage: normalizeOptionalText(
      body.instrumentAmountOrCoverage,
    ),
    validityPeriod: normalizeOptionalText(body.validityPeriod),
    paymentTrigger: normalizeOptionalText(body.paymentTrigger),
    beneficiary: normalizeOptionalText(body.beneficiary),

    sellerSideCompensation: normalizeOptionalText(body.sellerSideCompensation),
    buyerSideCompensation: normalizeOptionalText(body.buyerSideCompensation),
    compensationPayer: normalizeOptionalText(body.compensationPayer),
    compensationPayees: normalizeOptionalText(body.compensationPayees),
    compensationPayoutTrigger: normalizeOptionalText(
      body.compensationPayoutTrigger,
    ),
    compensationPaymentMethod: normalizeOptionalText(
      body.compensationPaymentMethod,
    ),
    compensationAuthorizationStatus: normalizeOptionalText(
      body.compensationAuthorizationStatus,
    ),
    compensationConfidentialityNote: normalizeOptionalText(
      body.compensationConfidentialityNote,
    ),
  };
}

function jsonError(error: string, status = 500, message?: string) {
  return NextResponse.json(
    {
      ok: false,
      error,
      message,
    },
    { status },
  );
}

async function requireOperatorAccess() {
  const principal = await getPrincipal();

  if (!principal) {
    return {
      principal: null,
      response: jsonError("UNAUTHORIZED", 401),
    };
  }

  return {
    principal,
    response: null,
  };
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { principal, response } = await requireOperatorAccess();

    if (!principal) {
      return response;
    }

    const { id } = await context.params;

    const dossier = await prisma.transactionDossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
        terms: true,
      },
    });

    if (!dossier) {
      return jsonError("DOSSIER_NOT_FOUND", 404);
    }

    return NextResponse.json({
      ok: true,
      dossierId: dossier.id,
      reference: dossier.reference,
      terms: {
        ...EMPTY_TERMS,
        ...(dossier.terms ?? {}),
      },
    });
  } catch (error) {
    console.error("[DOSSIER_TERMS_GET_FAILED]", error);

    return jsonError(
      "DOSSIER_TERMS_GET_FAILED",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { principal, response } = await requireOperatorAccess();

    if (!principal) {
      return response;
    }

    const { id } = await context.params;
    const body = (await req.json()) as TermsBody;
    const data = normalizeTermsBody(body);

    const dossier = await prisma.transactionDossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
      },
    });

    if (!dossier) {
      return jsonError("DOSSIER_NOT_FOUND", 404);
    }

    const terms = await prisma.transactionDossierTerms.upsert({
      where: {
        dossierId: dossier.id,
      },
      create: {
        dossierId: dossier.id,
        ...data,
      },
      update: data,
    });

    await prisma.transactionDossierEvent.create({
      data: {
        dossierId: dossier.id,
        eventType: "DOSSIER_TERMS_UPDATED",
        fromState: null,
        toState: null,
        message: "Structured dossier terms updated by operator.",
        actor: principal.email,
        metadata: {
          source: "control-center.terms",
          reference: dossier.reference,
          updatedFields: Object.entries(data)
            .filter(([, value]) => value !== null)
            .map(([key]) => key),
        },
      },
    });

    return NextResponse.json({
      ok: true,
      dossierId: dossier.id,
      reference: dossier.reference,
      terms: {
        ...EMPTY_TERMS,
        ...terms,
      },
    });
  } catch (error) {
    console.error("[DOSSIER_TERMS_PATCH_FAILED]", error);

    return jsonError(
      "DOSSIER_TERMS_PATCH_FAILED",
      500,
      error instanceof Error ? error.message : undefined,
    );
  }
}
