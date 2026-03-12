import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type VerifyBody = {
  seatKey?: string;
};

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 1000 * 60 * 10; // 10 minutes

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function timingSafeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function getAllowedHashes(): string[] {
  const raw = process.env.COUNCIL_SEAT_KEY_HASHES || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function signSession(payload: object) {
  const secret = process.env.COUNCIL_SESSION_SECRET;
  if (!secret) throw new Error("Missing COUNCIL_SESSION_SECRET");

  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "AXPT" })
  ).toString("base64url");

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const data = `${header}.${body}`;

  const sig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  return `${data}.${sig}`;
}

async function isLockedOut(ip?: string) {
  if (!ip) return false;

  const since = new Date(Date.now() - LOCK_WINDOW_MS);

  const failures = await prisma.councilAccessLog.count({
    where: {
      ipAddress: ip,
      success: false,
      createdAt: { gte: since },
    },
  });

  return failures >= MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as VerifyBody;

  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    undefined;

  if (await isLockedOut(ipAddress)) {
    await prisma.councilAccessLog.create({
      data: {
        success: false,
        ipAddress,
        userAgent,
        seatHash: "LOCKED",
        sessionIssued: false,
      },
    });

    return NextResponse.json(
      { ok: false, code: "LOCKED" },
      { status: 429 }
    );
  }

  const seatKey = (body.seatKey || "").trim();

  if (!seatKey || seatKey.length < 8) {
    return NextResponse.json(
      { ok: false, code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const allowed = getAllowedHashes();
  if (allowed.length === 0) {
    return NextResponse.json(
      { ok: false, code: "MISCONFIGURED" },
      { status: 500 }
    );
  }

  const incomingHash = sha256Hex(seatKey);
  console.log("Allowed:", allowed);
  console.log("Incoming:", incomingHash);

  const match = allowed.some(
    (h) =>
      h.length === incomingHash.length &&
      timingSafeEqualHex(h, incomingHash)
  );

  // artificial minimum response time (mitigates timing attacks)
  await new Promise((r) => setTimeout(r, 350));

  if (!match) {
    await prisma.councilAccessLog.create({
      data: {
        success: false,
        ipAddress,
        userAgent,
        seatHash: incomingHash,
        sessionIssued: false,
      },
    });

    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const now = Date.now();

  const session = signSession({
    kind: "council_session",
    iat: now,
    exp: now + 1000 * 60 * 60 * 6,
  });

  await prisma.councilAccessLog.create({
    data: {
      success: true,
      ipAddress,
      userAgent,
      seatHash: incomingHash,
      sessionIssued: true,
    },
  });

  const res = NextResponse.json({ ok: true });

  res.cookies.set({
    name: "axpt_council",
    value: session,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
