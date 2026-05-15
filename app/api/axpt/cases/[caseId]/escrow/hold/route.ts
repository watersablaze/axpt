export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { PrismaClient } from "@prisma/client"

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function POST(
  req: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params;
  const body = await req.json().catch(() => ({} as any))
  const escrowId =
    body?.escrowId ?? new URL(req.url).searchParams.get("escrowId")

  if (!escrowId) {
    return NextResponse.json(
      { ok: false, error: "ESCROW_ID_REQUIRED" },
      { status: 400 }
    )
  }

  const c = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!c) return NextResponse.json({ ok: false }, { status: 404 });

  try {
    await prisma.$transaction(async (tx: Tx) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      })

      if (!escrow || escrow.caseId !== caseId) {
        throw new Error("ESCROW_NOT_FOUND")
      }

      await tx.escrow.update({
        where: { id: escrow.id },
        data: { status: "ESCROW_HOLD" },
      })

      await tx.eventLog.create({
        data: {
          caseId,
          actor: "AXPT_SYSTEM",
          action: "ESCROW_HELD",
          detail: {},
        },
      });
    });
  } catch (err: any) {
    if (err?.message === "ESCROW_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "ESCROW_NOT_FOUND" },
        { status: 404 }
      )
    }

    throw err
  }

  return NextResponse.redirect(
    new URL(`/admin/cases/${caseId}`, req.url)
  );
}
