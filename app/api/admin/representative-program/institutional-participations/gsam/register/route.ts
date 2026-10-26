import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import {
  registerGsamInstitutionalParticipation,
} from "@/domains/institutions/french-ward/gsam/registerGsamInstitutionalParticipation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers });
}

/**
 * Administrative recognition of the FW-GSAM institutional
 * relationship only.
 *
 * No ARP admission, appointment, CUP entitlement, account
 * provisioning, communication membership, or JV verification.
 */
export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal?.userId) {
    return json({
      ok: false,
      error: "UNAUTHORIZED",
    }, 401);
  }

  if (
    !isAdmin(principal) ||
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE
    )
  ) {
    return json({
      ok: false,
      error: "OPERATOR_PERMISSION_REQUIRED",
    }, 403);
  }

  if (
    request.headers.get("origin") !==
    new URL(request.url).origin
  ) {
    return json({
      ok: false,
      error: "REQUEST_ORIGIN_MISMATCH",
    }, 403);
  }

  if (
    request.headers.get("x-gsam-confirm") !==
    "REGISTER GSAM INSTITUTIONAL FOUNDATION"
  ) {
    return json({
      ok: false,
      error: "EXPLICIT_CONFIRMATION_REQUIRED",
    }, 400);
  }

  // Identity and actor are server-controlled.
  // Reject all client-supplied registration fields.
  const body = await request.text().catch(() => null);

  if (body === null || body.length !== 0) {
    return json({
      ok: false,
      error: "REGISTRATION_BODY_NOT_ALLOWED",
    }, 400);
  }

  if (
    process.env.GSAM_INSTITUTIONAL_REGISTRATION_ENABLED !==
    "enabled"
  ) {
    return json({
      ok: false,
      error: "GSAM_INSTITUTIONAL_REGISTRATION_DISABLED",
    }, 403);
  }

  try {
    const result =
      await registerGsamInstitutionalParticipation({
        client: prisma,
        actorUserId: principal.userId,
      });

    return json({
      ok: true,
      reference: result.record.reference,
      created: result.created,
      institution: result.record.institutionLegalName,
      representative: result.record.representativeName,
      capacity: result.record.representativeCapacity,
      governingBasis: result.record.governingBasis,
      programScope: result.record.programScope,
      documentationStatus: result.record.documentationStatus,
      accessStatus: result.record.accessStatus,
      createdAt: result.record.createdAt,
      updatedAt: result.record.updatedAt,
      authorityGranted: false,
      appointmentCreated: false,
      resourceAccessGranted: false,
      communicationsMembershipCreated: false,
    }, result.created ? 201 : 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "GSAM_INSTITUTIONAL_PARTICIPATION_CONFLICT"
    ) {
      return json({
        ok: false,
        error: "INSTITUTIONAL_REGISTRATION_CONFLICT",
      }, 409);
    }

    console.error(
      "[gsam-institutional-registration]",
      error instanceof Error ? error.name : "unknown",
    );

    return json({
      ok: false,
      error: "INSTITUTIONAL_REGISTRATION_UNAVAILABLE",
    }, 503);
  }
}
