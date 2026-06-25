import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";
import { findRequiredDossierDocumentByInstrumentType } from "@/domains/control-center/dossiers/documentRequirements";

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type Body = {
  instrumentType?: string;
  title?: string;
};

export async function POST(req: Request, context: RouteContext) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as Body;

  if (!body.instrumentType) {
    return NextResponse.json(
      { ok: false, error: "MISSING_INSTRUMENT_TYPE" },
      { status: 400 },
    );
  }

  const requiredDocument = findRequiredDossierDocumentByInstrumentType(
    body.instrumentType,
  );

  if (!requiredDocument) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_OR_UNSUPPORTED_INSTRUMENT_TYPE",
        instrumentType: body.instrumentType,
      },
      { status: 400 },
    );
  }

  try {
    const dossier = await prisma.transactionDossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
      },
    });

    if (!dossier) {
      return NextResponse.json(
        { ok: false, error: "DOSSIER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const existing = await prisma.transactionDossierInstrument.findFirst({
      where: {
        dossierId: dossier.id,
        type: requiredDocument.instrumentType,
      },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyExists: true,
        instrument: existing,
      });
    }

    const title = body.title ?? requiredDocument.label;
    const result = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const instrument = await tx.transactionDossierInstrument.create({
          data: {
            dossierId: dossier.id,
            type: requiredDocument.instrumentType,
            status: "DRAFT",
            version: "v1.0",
            title,
            notes: `Drafted from dossier document readiness matrix by ${principal.email}.`,
          },
        });

        const event = await tx.transactionDossierEvent.create({
          data: {
            dossierId: dossier.id,
            eventType: "DOSSIER_INSTRUMENT_DRAFTED",
            fromState: null,
            toState: null,
            message: `${title} draft instrument created.`,
            actor: principal.email,
            metadata: {
              source: "control-center.documents",
              reference: dossier.reference,
              instrumentId: instrument.id,
              instrumentType: instrument.type,
              requiredDocumentKey: requiredDocument.key,
              requiredFor: requiredDocument.requiredFor,
            },
          },
        });

        return {
          instrument,
          event,
        };
      },
    );

    return NextResponse.json({
      ok: true,
      alreadyExists: false,
      instrument: result.instrument,
      event: result.event,
    });
  } catch (err) {
    console.error("[INSTRUMENT_DRAFT_CREATE_FAILED]", err);

    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        ok: false,
        error: "INSTRUMENT_DRAFT_CREATE_FAILED",
        message,
      },
      { status: 500 },
    );
  }
}
