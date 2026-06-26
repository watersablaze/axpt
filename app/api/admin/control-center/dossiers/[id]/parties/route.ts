import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/lib/prisma";

type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreatePartyBody = {
  role?: string;
  legalName?: string;
  representative?: string | null;
  country?: string | null;
  notes?: string | null;
};

const allowedRoles = new Set([
  "BUYER",
  "SELLER",
  "COORDINATOR",
  "COOPERATIVE",
  "REFINERY",
  "TREASURY_CONTACT",
  "LOGISTICS_CONTACT",
]);

export async function POST(req: Request, context: RouteContext) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as CreatePartyBody;

  if (!body.role || !allowedRoles.has(body.role)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_PARTY_ROLE" },
      { status: 400 },
    );
  }

  if (!body.legalName?.trim()) {
    return NextResponse.json(
      { ok: false, error: "MISSING_LEGAL_NAME" },
      { status: 400 },
    );
  }

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

  try {
    const result = await prisma.$transaction(
      async (tx: PrismaTransactionClient) => {
        const party = await tx.transactionDossierParty.create({
          data: {
            dossierId: dossier.id,
            role: body.role,
            legalName: body.legalName?.trim(),
            representative: body.representative?.trim() || null,
            country: body.country?.trim() || null,
            notes: body.notes?.trim() || null,
          },
        });

        const event = await tx.transactionDossierEvent.create({
          data: {
            dossierId: dossier.id,
            eventType: "DOSSIER_PARTY_CREATED",
            fromState: null,
            toState: null,
            message: `${body.role} party record created by ${principal.email}.`,
            actor: principal.email,
            metadata: {
              source: "control-center.party-review",
              reference: dossier.reference,
              partyId: party.id,
              role: party.role,
            },
          },
        });

        return {
          party,
          event,
        };
      },
    );

    return NextResponse.json({
      ok: true,
      party: result.party,
      event: result.event,
    });
  } catch (err) {
    console.error("[DOSSIER_PARTY_CREATE_FAILED]", err);

    return NextResponse.json(
      {
        ok: false,
        error: "DOSSIER_PARTY_CREATE_FAILED",
        message: err instanceof Error ? err.message : "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}
