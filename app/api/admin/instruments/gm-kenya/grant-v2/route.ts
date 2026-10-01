import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { globalMotherV3Definition } from "@/domains/instruments/definitions/globalMotherV3Definition";
import { runInstrumentGovernanceTransaction } from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";
import { issueInstrumentAccessGrantWithClient } from "@/domains/instruments/commands/issueInstrumentAccessGrantWithClient";
import { ensureInstrumentParticipantIdentityWithClient } from "@/domains/instruments/commands/ensureInstrumentParticipantIdentityWithClient";
import { sendGlobalMotherChamberInvitation } from "@/domains/instruments/communications/globalMotherChamberInvitation";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "ORIGIN_REQUIRED" }, { status: 403 });
  const principal = await getPrincipal();
  if (!isAdmin(principal) || !principal)
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }
  if (!input || typeof input !== "object" || Array.isArray(input))
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  const values = input as Record<string, unknown>;
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const institution = typeof values.institution === "string" ? values.institution.trim() : "";
  const capacity = typeof values.capacity === "string" ? values.capacity.trim() : "";
  if (email.length > 254 || !email.includes("@") || !name || name.length > 160 ||
      !institution || institution.length > 160 || !capacity || capacity.length > 160 ||
      typeof values.versionId !== "string")
    return NextResponse.json({ error: "IDENTITY_AND_CAPACITY_REQUIRED" }, { status: 400 });
  try {
    const issued = await runInstrumentGovernanceTransaction(prisma, async tx => {
      const instrument = await tx.institutionalInstrument.findUnique({
        where: { reference: globalMotherV3Definition.reference },
        select: { id: true, currentVersion: true,
          versions: { where: { number: globalMotherV3Definition.version, status: "ISSUED" }, select: { id: true } },
        },
      });
      const version = instrument?.versions[0];
      if (!instrument || instrument.currentVersion !== globalMotherV3Definition.version || !version || version.id !== values.versionId)
        throw new Error("[GM_V2_GRANT_VERSION_NOT_ISSUED]");
      const { user } = await ensureInstrumentParticipantIdentityWithClient({
        client: tx, instrumentReference: globalMotherV3Definition.reference,
        email, displayName: name, createdByUserId: principal.userId,
      });
      const existing = await tx.instrumentAccessGrant.findFirst({
        where: { instrumentVersionId: version.id, recipientUserId: user.id,
          revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true },
      });
      if (existing) throw new Error("[GM_V2_GRANT_ALREADY_ACTIVE]");
      return issueInstrumentAccessGrantWithClient({
        client: tx, instrumentReference: globalMotherV3Definition.reference,
        recipientName: name, recipientUserId: user.id, versionNumber: globalMotherV3Definition.version,
        representedInstitution: institution, representativeCapacity: capacity,
        recipientRole: "DELIBERATOR", accessLevel: "DELIBERATE",
        issuedByUserId: principal.userId,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
    }, { timeoutMs: 30000 });
    const privatePath =
      `/french-ward/instruments/gm-kenya/access/${issued.token}`;
    const accessUrl =
      `${new URL(request.url).origin}${privatePath}`;

    let invitation:
      | { ok: true; mode: "send" | "log"; messageId: string | null }
      | { ok: false; error: "INVITATION_SEND_FAILED" };

    try {
      const delivery =
        await sendGlobalMotherChamberInvitation({
          grantId:
            issued.grant.id,
          deliveryKey:
            issued.grant.id,
          recipientName:
            name,
          recipientEmail:
            email,
          representedInstitution:
            institution,
          representativeCapacity:
            capacity,
          accessUrl,
        });

      invitation = {
        ok: true,
        mode: delivery.mode,
        messageId: delivery.messageId,
      };
    } catch (deliveryError) {
      console.error(
        "[gm-v2/grant] invitation delivery failed",
        deliveryError,
      );
      invitation = {
        ok: false,
        error: "INVITATION_SEND_FAILED",
      };
    }

    return NextResponse.json({
      ok: true,
      grantId: issued.grant.id,
      privatePath,
      invitation,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("[GM_V2_GRANT_") || message.startsWith("[INSTRUMENT_ACCESS_"))
      return NextResponse.json({ error: message }, { status: 409 });
    console.error("[gm-v2/grant] failed", error);
    return NextResponse.json({ error: "GRANT_FAILED" }, { status: 500 });
  }
}
