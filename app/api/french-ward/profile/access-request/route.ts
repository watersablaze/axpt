import { queueAdminIncomingAlert, dispatchAdminIncomingAlert } from "@/domains/admin-incoming/adminIncomingAlerts";
import { NextResponse } from "next/server";
import { requestInstitutionalAccessWithClient } from "@/domains/institutional-access/manageInstitutionalAccessWithClient";
import { projectFrenchWardInstitutionalProfile } from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { prisma } from "@/infrastructure/db/prisma";

function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profile = projectFrenchWardInstitutionalProfile();
    const result = await requestInstitutionalAccessWithClient({
      onRequested: (tx, id) => queueAdminIncomingAlert(tx, { kind: "PROFILE_REQUEST", sourceId: id }),
      client: prisma,
      requesterName: field(body.requesterName),
      requesterEmail: field(body.requesterEmail),
      institutionalAffiliation: field(body.institutionalAffiliation),
      requesterCapacity: field(body.requesterCapacity),
      purpose: field(body.purpose),
      scope: "PROFILE_VIEW",
      resourceReference: profile.reference,
      resourceVersion: profile.version,
    });
    await dispatchAdminIncomingAlert(prisma, { kind: "PROFILE_REQUEST", sourceId: result.id });
    return NextResponse.json({
      ok: true,
      request: { id: result.id, status: result.status },
    }, { status: 201 });
  } catch (error) {
    console.error("[french-ward:profile-access-request]", error);
    const message = error instanceof Error ? error.message : "";
    const badInput = message.startsWith("REQUIRED:") || message === "INVALID_REQUESTER_EMAIL";
    return NextResponse.json({
      ok: false,
      error: badInput
        ? "Complete all required fields with a valid email address."
        : "Unable to submit institutional profile access request.",
    }, { status: badInput ? 400 : 500 });
  }
}
