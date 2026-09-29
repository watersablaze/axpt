import { randomBytes, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { type GlobalMotherRecipientTransactionClient, lockGlobalMotherGrant, nonceHash, recipientCookieOptions } from "@/domains/instruments/access/globalMotherRecipientAuth";
import { sendGlobalMotherRecipientPin } from "@/domains/instruments/access/sendGlobalMotherRecipientPin";
import { GM_PENDING_COOKIE, GM_CHALLENGE_COOKIE, PIN_TTL_MS, SEND_WINDOW_MS, canSendCode } from "@/domains/instruments/access/globalMotherRecipientPolicy";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return NextResponse.json({ error: "Open your private link and try again." }, { status: 403 });
  const token = (await cookies()).get(GM_PENDING_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Open your private link again." }, { status: 401 });
  const pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const pinHash = await bcrypt.hash(pin, 12);
  const nonce = randomBytes(32).toString("base64url");
  try {
    const result = await prisma.$transaction(async (tx: GlobalMotherRecipientTransactionClient) => {
      const access = await lockGlobalMotherGrant(tx, token);
      if (!access) return { state: "blocked" } as const;
      const now = new Date();
      const existing = await tx.globalMotherRecipientChallenge.findUnique({
        where: { grantId: access.grant.id },
      });
      if (!canSendCode(existing, now)) return { state: "limited" } as const;
      const newWindow = !existing || now.getTime() - existing.windowStartedAt.getTime() >= SEND_WINDOW_MS;
      const data = {
        recipientUserId: access.user.id, email: access.user.email, pinHash,
        nonceHash: nonceHash(nonce), attemptCount: 0, consumedAt: null,
        expiresAt: new Date(Math.min(now.getTime() + PIN_TTL_MS, access.grant.expiresAt!.getTime())),
        sentAt: now, windowStartedAt: newWindow ? now : existing!.windowStartedAt,
        sendCount: newWindow ? 1 : existing!.sendCount + 1,
      };
      await tx.globalMotherRecipientChallenge.upsert({
        where: { grantId: access.grant.id },
        create: { grantId: access.grant.id, ...data }, update: data,
      });
      return { state: "ready", grantId: access.grant.id, email: access.user.email } as const;
    }, { maxWait: 10_000, timeout: 30_000 });
    if (result.state === "blocked")
      return NextResponse.json({ error: "This access is unavailable. Contact the Framework coordinator." }, { status: 403 });
    if (result.state === "limited")
      return NextResponse.json({ error: "Wait at least one minute before resending. Five codes may be requested per hour." },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } });
    try { await sendGlobalMotherRecipientPin(result.email, pin); }
    catch {
      await prisma.globalMotherRecipientChallenge.updateMany({
        where: { grantId: result.grantId, pinHash, nonceHash: nonceHash(nonce) },
        data: { consumedAt: new Date() },
      });
      return NextResponse.json({ error: "The code could not be delivered. Wait one minute and try again." }, { status: 503 });
    }
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(GM_CHALLENGE_COOKIE, nonce, { ...recipientCookieOptions, maxAge: 600 });
    return response;
  } catch {
    console.error("[gm/recipient] code request failed");
    return NextResponse.json({ error: "Verification is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
