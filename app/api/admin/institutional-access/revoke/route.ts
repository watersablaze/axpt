import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { revokeProfileAccessWithClient } from "@/domains/institutional-access/manageProfileAccessWithClient";
import { revokeCommercialIntakeAccessWithClient } from "@/domains/institutional-access/manageCommercialIntakeAccessWithClient";
import { prisma } from "@/infrastructure/db/prisma";

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return NextResponse.json({ok:false,error:"Authentication required"},{status:401});
  if (!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE)) return NextResponse.json({ok:false,error:"Not authorized"},{status:403});
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object") return NextResponse.json({ok:false,error:"Invalid request"},{status:400});
    const body = input as Record<string,unknown>;
    const grantId = typeof body.grantId === "string" ? body.grantId.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!grantId || !reason || reason.length > 3000) return NextResponse.json({ok:false,error:"Grant and reason required"},{status:400});
    const grant =
      await prisma.institutionalAccessGrant.findUnique({
        where: { id: grantId },
        select: { scope: true },
      });

    if (!grant) {
      return NextResponse.json(
        { ok: false, error: "Grant not found." },
        { status: 404 },
      );
    }

    const revoke =
      grant.scope === "PROFILE_VIEW"
        ? revokeProfileAccessWithClient
        : grant.scope === "LOI_INTAKE_ACCESS"
          ? revokeCommercialIntakeAccessWithClient
          : null;

    if (!revoke) {
      return NextResponse.json(
        { ok: false, error: "Unsupported access scope." },
        { status: 409 },
      );
    }

    const result =
      await revoke({
        client: prisma,
        actor: principal,
        grantId,
        reason,
      });

    return NextResponse.json({ok:true,result});
  } catch (e) {
    console.error("[institutional-access:revoke]",e);
    return NextResponse.json({ok:false,error:"Revocation could not be recorded."},{status:409});
  }
}
