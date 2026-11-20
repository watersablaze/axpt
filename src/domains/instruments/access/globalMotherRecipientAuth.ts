import "server-only";
import { globalMotherV4Definition } from "../definitions/globalMotherV4Definition";
import { createHash, createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { SIGNING_SECRET } from "@/infrastructure/env/secrets";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import type { Principal } from "@/domains/auth/types";
import { hashInstrumentAccessToken, institutionalInstrumentAccessCookieName } from "./accessToken";
import { GM_REFERENCE, GM_ROUTE, GM_SESSION_COOKIE } from "./globalMotherRecipientPolicy";

type Client = Pick<PrismaClient, "instrumentAccessGrant" | "instrumentVersion" | "user" | "institutionalInstrument">;
export type GlobalMotherRecipientTransactionClient = Client & Pick<PrismaClient, "$queryRaw" | "globalMotherRecipientChallenge" | "session" | "domainEvent">;
const AUDIENCE = "axpt:gm-recipient";
// A recipient token cannot be verified by the general operator session reader.
const recipientKey = () => createHmac("sha256", SIGNING_SECRET).update(AUDIENCE).digest();
export const nonceHash = (value: string) => createHash("sha256").update(value).digest("hex");
export const recipientCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const, path: GM_ROUTE,
};

export async function resolveGlobalMotherRecipient(client: Client, token: string, now = new Date()) {
  if (!token || token.length > 512) return null;
  const grant = await client.instrumentAccessGrant.findUnique({
    where: { codeHash: hashInstrumentAccessToken(token) },
  });
  if (!grant || grant.revokedAt || !grant.recipientUserId || !grant.instrumentVersionId ||
      !grant.expiresAt || grant.expiresAt <= now || grant.accessLevel !== "DELIBERATE" ||
      !grant.representedInstitution || !grant.representativeCapacity) return null;
  const instrument = await client.institutionalInstrument.findUnique({
    where: { id: grant.instrumentId }, select: { reference: true, currentVersion: true },
  });
  const version = await client.instrumentVersion.findUnique({
    where: { id: grant.instrumentVersionId },
    select: { instrumentId: true, number: true, status: true },
  });
  if (instrument?.reference !== GM_REFERENCE || instrument.currentVersion !== globalMotherV4Definition.version ||
      !version || version.instrumentId !== grant.instrumentId ||
      version.number !== globalMotherV4Definition.version || version.status !== "ISSUED") return null;
  const user = await client.user.findUnique({
    where: { id: grant.recipientUserId },
    select: { id: true, email: true, displayName: true, name: true },
  });
  if (!user?.email) return null;
  return { grant, user };
}

export async function signGlobalMotherRecipientSession(input: {
  userId: string; grantId: string; versionId: string; tokenId: string; expiresAt: Date;
}) {
  return new SignJWT({
    userId: input.userId, grantId: input.grantId,
    versionId: input.versionId, tokenId: input.tokenId,
  }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENCE)
    .setIssuedAt().setExpirationTime(Math.floor(input.expiresAt.getTime() / 1000))
    .sign(recipientKey());
}

export async function getGlobalMotherPrincipal(): Promise<Principal | null> {
  const jar = await cookies();
  const token = jar.get(GM_SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, recipientKey(), {
        algorithms: ["HS256"], audience: AUDIENCE,
      });
      if (typeof payload.tokenId !== "string" || typeof payload.userId !== "string" ||
          typeof payload.grantId !== "string" || typeof payload.versionId !== "string") return null;
      const session = await prisma.session.findUnique({ where: { tokenId: payload.tokenId } });
      if (!session || session.status !== "active" || session.invalidatedAt ||
          !session.expiresAt || session.expiresAt <= new Date() ||
          session.userId !== payload.userId ||
          session.deviceInfo !== `gm-grant:${payload.grantId}`) return null;
      const grant = await prisma.instrumentAccessGrant.findUnique({ where: { id: payload.grantId } });
      if (!grant || grant.recipientUserId !== payload.userId ||
          grant.instrumentVersionId !== payload.versionId || grant.revokedAt ||
          !grant.expiresAt || grant.expiresAt <= new Date()) return null;
      const accessToken = jar.get(institutionalInstrumentAccessCookieName(GM_REFERENCE))?.value;
      const access = accessToken ? await resolveGlobalMotherRecipient(prisma, accessToken) : null;
      if (!access || access.grant.id !== payload.grantId) return null;
      const user = await prisma.user.findUnique({
        where: { id: session.userId }, select: { id: true, email: true, displayName: true, name: true },
      });
      if (!user) return null;
      return { userId: user.id, email: user.email, displayName: user.displayName ?? user.name,
        roles: [], permissions: [], sessionId: session.id };
    } catch { return null; }
  }
  return getPrincipal();
}

export async function lockGlobalMotherGrant(tx: GlobalMotherRecipientTransactionClient, token: string) {
  await tx.$queryRaw`SELECT "id" FROM "InstrumentAccessGrant"
    WHERE "codeHash" = ${hashInstrumentAccessToken(token)} FOR UPDATE`;
  return resolveGlobalMotherRecipient(tx, token);
}
