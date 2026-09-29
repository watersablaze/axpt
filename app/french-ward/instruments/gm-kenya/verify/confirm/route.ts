import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { institutionalInstrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { type GlobalMotherRecipientTransactionClient, lockGlobalMotherGrant, nonceHash, recipientCookieOptions, resolveGlobalMotherRecipient, signGlobalMotherRecipientSession } from "@/domains/instruments/access/globalMotherRecipientAuth";
import { resolveInstitutionalInstrumentAccessWithClient } from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import { GM_REFERENCE, GM_ROUTE, GM_PENDING_COOKIE, GM_CHALLENGE_COOKIE, GM_SESSION_COOKIE, MAX_ATTEMPTS, canConsumeCode } from "@/domains/instruments/access/globalMotherRecipientPolicy";

export const runtime = "nodejs";
const denied = () => NextResponse.json({
  error: "Invalid or expired code. Request a new code if needed.",
}, { status: 401, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Open your private link and try again." }, { status: 403 });
  const jar = await cookies();
  const token = jar.get(GM_PENDING_COOKIE)?.value;
  const nonce = jar.get(GM_CHALLENGE_COOKIE)?.value;
  let input: unknown;
  try { input = await request.json(); } catch { return denied(); }
  const pin = input && typeof input === "object" && "pin" in input ? input.pin : null;
  if (!token || !nonce || typeof pin !== "string" || !/^\d{6}$/.test(pin)) return denied();
  try {
    const access = await resolveGlobalMotherRecipient(prisma, token);
    if (!access) return denied();
    const challenge = await prisma.globalMotherRecipientChallenge.findUnique({
      where: { grantId: access.grant.id },
    });
    const expectedNonce = nonceHash(nonce);
    if (!challenge || challenge.nonceHash !== expectedNonce ||
        !canConsumeCode(challenge, challenge, new Date())) return denied();
    const valid = await bcrypt.compare(pin, challenge.pinHash);
    const tokenId = randomUUID();
    const expiresAt = new Date(Math.min(Date.now() + 24 * 60 * 60_000, access.grant.expiresAt!.getTime()));
    const signed = valid ? await signGlobalMotherRecipientSession({
      userId: access.user.id, grantId: access.grant.id,
      versionId: access.grant.instrumentVersionId!, tokenId, expiresAt,
    }) : null;
    const recorded = await prisma.$transaction(async (tx: GlobalMotherRecipientTransactionClient) => {
      const current = await lockGlobalMotherGrant(tx, token);
      if (!current || current.user.id !== challenge.recipientUserId ||
          current.user.email !== challenge.email ||
          current.grant.instrumentVersionId !== access.grant.instrumentVersionId) return false;
      const row = await tx.globalMotherRecipientChallenge.findUnique({ where: { grantId: current.grant.id } });
      const now = new Date();
      if (!row || !canConsumeCode(row, { pinHash: challenge.pinHash, nonceHash: expectedNonce }, now)) return false;
      if (!valid) {
        const count = row.attemptCount + 1;
        await tx.globalMotherRecipientChallenge.update({
          where: { grantId: row.grantId },
          data: { attemptCount: count, consumedAt: count >= MAX_ATTEMPTS ? now : null },
        });
        return false;
      }
      await tx.globalMotherRecipientChallenge.update({
        where: { grantId: row.grantId }, data: { consumedAt: now },
      });
      await tx.session.create({
        data: {
          userId: current.user.id, tokenId, status: "active", startedAt: now, expiresAt,
          deviceInfo: `gm-grant:${current.grant.id}`,
          userAgent: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        },
      });
      const opened = await resolveInstitutionalInstrumentAccessWithClient({
        client: tx, instrumentReference: GM_REFERENCE, token, recordAccess: true,
      });
      if (!opened) throw new Error("GM_ACCESS_CHANGED");
      return true;
    }, { maxWait: 10_000, timeout: 30_000 });
    if (!recorded || !signed) return denied();
    const response = NextResponse.json({ ok: true, destination: GM_ROUTE },
      { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(GM_SESSION_COOKIE, signed, { ...recipientCookieOptions, expires: expiresAt });
    response.cookies.set(institutionalInstrumentAccessCookieName(GM_REFERENCE), token,
      { ...recipientCookieOptions, expires: access.grant.expiresAt! });
    response.cookies.set(GM_PENDING_COOKIE, "", { ...recipientCookieOptions, maxAge: 0 });
    response.cookies.set(GM_CHALLENGE_COOKIE, "", { ...recipientCookieOptions, maxAge: 0 });
    return response;
  } catch {
    console.error("[gm/recipient] code verification failed");
    return NextResponse.json({ error: "Verification is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
