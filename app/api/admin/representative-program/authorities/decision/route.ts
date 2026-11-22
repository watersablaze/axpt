import { NextResponse } from "next/server";
import { z } from "zod";
import type { PrismaClient } from "@prisma/client";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import {
  recordRepresentativeProgramAuthorityWithClient,
  type RepresentativeProgramAuthorityRecordingClient,
} from "@/domains/instruments/representative-program/commands/recordRepresentativeProgramAuthorityWithClient";
import { revokeRepresentativeProgramAuthorityWithClient } from
  "@/domains/instruments/representative-program/commands/revokeRepresentativeProgramAuthorityWithClient";
import { resolveRepresentativeProgramAuthorityExercisabilityWithClient } from
  "@/domains/instruments/representative-program/queries/resolveRepresentativeProgramAuthorityExercisabilityWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Client = RepresentativeProgramAuthorityRecordingClient &
  Pick<PrismaClient, "user">;

const identifier = z.string().trim().min(1).max(191);
const authorityKey = z.enum([
  "ARP.ACCESS",
  "ARP.INTRODUCTION",
  "ARP.COMMUNICATION",
  "ARP.PRESENTATION",
  "ARP.COORDINATION",
  "ARP.NEGOTIATION",
  "ARP.DOCUMENTARY_AUTHORITY",
  "ARP.BINDING_AUTHORITY",
]);

const stringList = z.array(z.string().trim().min(1).max(191)).max(50);
const conditions = z.object({
  transactionReferences: stringList.optional(),
  counterpartyReferences: stringList.optional(),
  territory: stringList.optional(),
  requiresPriorApproval: z.boolean().optional(),
  approvalAuthority: z.string().trim().min(1).max(500).optional(),
  documentClasses: stringList.optional(),
  monetaryLimit: z.string().trim().min(1).max(191).optional(),
  allowWhileRestricted: z.boolean().optional(),
  notes: z.string().trim().min(1).max(4000),
}).strict();

const requestSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("RECORD"),
    appointmentId: identifier,
    authorityKey,
    authorityClass: z.enum(["RESERVED", "DELEGATED", "JOINT", "PROHIBITED"]),
    action: z.string().trim().min(1).max(2000),
    conditions,
    effectiveAt: z.string().datetime(),
    expiresAt: z.string().datetime().nullable(),
    confirmDecision: z.literal(true),
  }).strict(),
  z.object({
    decision: z.literal("REVOKE"),
    appointmentId: identifier,
    authorityKey,
    expectedAuthorityId: identifier,
    confirmDecision: z.literal(true),
  }).strict(),
]);

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return NextResponse.json({ ok: false }, { status: 401, headers });
  }
  if (!isAdmin(principal)) {
    return NextResponse.json({ ok: false }, { status: 403, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_REQUEST" },
      { status: 400, headers },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "INVALID_REQUEST" },
      { status: 400, headers },
    );
  }

  const input = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx: Client) => {
      const actor: { isAdmin: boolean } | null = await tx.user.findUnique({
        where: { id: principal.userId },
        select: { isAdmin: true },
      });
      if (!actor?.isAdmin) throw new Error("[ARP_AUTHORITY_OPERATOR_REQUIRED]");

      const appointment: {
        instrumentId: string;
        effectiveAt: Date | null;
        expiresAt: Date | null;
        endedAt: Date | null;
        instrument: { status: string };
        participant: { standing: string };
      } | null = await tx.representativeProgramAppointment.findUnique({
        where: { id: input.appointmentId },
        select: {
          instrumentId: true,
          effectiveAt: true,
          expiresAt: true,
          endedAt: true,
          instrument: { select: { status: true } },
          participant: { select: { standing: true } },
        },
      });
      if (!appointment) throw new Error("[ARP_AUTHORITY_APPOINTMENT_REQUIRED]");

      const now = new Date();

      if (input.decision === "RECORD") {
        const effectiveAt = new Date(input.effectiveAt);
        const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

        if (
          appointment.instrument.status !== "ACTIVE" ||
          appointment.participant.standing !== "ACTIVE" ||
          !appointment.effectiveAt ||
          appointment.effectiveAt.getTime() > now.getTime() ||
          appointment.endedAt ||
          (appointment.expiresAt &&
            appointment.expiresAt.getTime() <= now.getTime()) ||
          effectiveAt.getTime() > now.getTime() ||
          (expiresAt && expiresAt.getTime() <= now.getTime()) ||
          (appointment.expiresAt &&
            (!expiresAt ||
              expiresAt.getTime() > appointment.expiresAt.getTime()))
        ) {
          throw new Error("[ARP_AUTHORITY_RECORD_STATE_CONFLICT]");
        }

        const recorded = await recordRepresentativeProgramAuthorityWithClient({
          client: tx,
          appointmentId: input.appointmentId,
          authorityKey: input.authorityKey,
          authorityClass: input.authorityClass,
          action: input.action,
          conditions: input.conditions,
          effectiveAt,
          expiresAt,
          actorUserId: principal.userId,
        });

        return {
          decision: "RECORD",
          authorityId: recorded.authority.id,
          changed: recorded.created,
        };
      }

      const target: {
        instrumentId: string;
        authorityKey: string;
        revokedAt: Date | null;
      } | null = await tx.instrumentAuthority.findUnique({
        where: { id: input.expectedAuthorityId },
        select: {
          instrumentId: true,
          authorityKey: true,
          revokedAt: true,
        },
      });

      if (
        !target ||
        target.instrumentId !== appointment.instrumentId ||
        target.authorityKey !== input.authorityKey
      ) {
        throw new Error("[ARP_AUTHORITY_REVIEW_CHANGED]");
      }

      if (target.revokedAt) {
        return {
          decision: "REVOKE",
          authorityId: input.expectedAuthorityId,
          changed: false,
        };
      }

      const current =
        await resolveRepresentativeProgramAuthorityExercisabilityWithClient({
          client: tx,
          appointmentId: input.appointmentId,
          authorityKey: input.authorityKey,
          at: now,
        });

      if (current.authority?.id !== input.expectedAuthorityId) {
        throw new Error("[ARP_AUTHORITY_REVIEW_CHANGED]");
      }

      const revoked = await revokeRepresentativeProgramAuthorityWithClient({
        client: tx,
        appointmentId: input.appointmentId,
        authorityKey: input.authorityKey,
        revokedByUserId: principal.userId,
        revokedAt: now,
      });

      if (
        !revoked.revoked ||
        revoked.authorityId !== input.expectedAuthorityId
      ) {
        throw new Error("[ARP_AUTHORITY_REVIEW_CHANGED]");
      }

      return {
        decision: "REVOKE",
        authorityId: revoked.authorityId,
        changed: true,
      };
    }, {
      isolationLevel: "Serializable",
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json({ ok: true, result }, { headers });
  } catch (error) {
    const conflict =
      error instanceof Error &&
      (error.message.startsWith("[ARP_") ||
        error.message.startsWith("[INSTRUMENT_"));
    const concurrent =
      typeof error === "object" && error !== null &&
      "code" in error && error.code === "P2034";

    console.error("[ARP_AUTHORITY_DECISION_FAILED]");

    return NextResponse.json({
      ok: false,
      error: conflict || concurrent
        ? "AUTHORITY_DECISION_CONFLICT"
        : "AUTHORITY_DECISION_FAILED",
    }, {
      status: conflict || concurrent ? 409 : 503,
      headers,
    });
  }
}
