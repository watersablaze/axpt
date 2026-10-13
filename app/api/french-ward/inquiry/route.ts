import { NextResponse } from "next/server";
import { resend } from "@/infrastructure/email/client";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const HOURLY_LIMIT = 6;
const WINDOW_SECONDS = 3600;
const DESTINATION = "french-ward@axpt.io";
const allowedSubjects = new Set([
  "Business relationship",
  "Commercial opportunity",
  "Institutional cooperation",
  "General inquiry",
]);

function field(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

function failure(error: string, status: number, retryAfter?: number) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
      },
    },
  );
}

/**
 * Only same-origin browser submissions are accepted.
 * Do not rely on the Origin header alone as bot protection.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Best-effort throttling for this server instance. No Redis service or new
 * environment variables are required. This is NOT a distributed limiter:
 * parallel Vercel instances and cold starts do not share counters. Keep
 * Vercel's platform-level attack protection enabled independently.
 */
type RateEntry = { count: number; resetAt: number };
const attempts = new Map<string, RateEntry>();
const MAX_TRACKED_CLIENTS = 1000;
const UNKNOWN_CLIENT = "unknown-client";

function checkRateLimit(request: Request): "allowed" | "limited" {
  // IP headers are advisory unless injected/overwritten by trusted ingress.
  // Do not treat this as a security identity or a distributed rate limit.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const client = (realIp || forwarded || UNKNOWN_CLIENT).slice(0, 128);
  const now = Date.now();

  // Prune expired entries and cap memory usage in long-lived instances.
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }

  let entry = attempts.get(client);
  if (!entry) {
    // Fail closed for a novel client if storage is saturated with live keys.
    if (attempts.size >= MAX_TRACKED_CLIENTS) return "limited";
    entry = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
    attempts.set(client, entry);
  }
  entry.count += 1;
  return entry.count > HOURLY_LIMIT ? "limited" : "allowed";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return failure("Unable to process inquiry.", 403);
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (!Number.isFinite(declaredLength) || declaredLength > MAX_BODY_BYTES) {
    return failure("Message exceeds the size limit.", 413);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return failure("Message exceeds the size limit.", 413);
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return failure("Invalid inquiry.", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return failure("Invalid inquiry.", 400);
  }

  // Honeypot: never send, and never claim a successful delivery.
  if (field(body, "website")) return failure("Unable to process inquiry.", 400);

  const name = field(body, "name");
  const email = field(body, "email").toLowerCase();
  const organization = field(body, "organization");
  const subject = field(body, "subject");
  const message = field(body, "message");

  if (!name || name.length > 120 || !email || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !organization || organization.length > 180 ||
      !allowedSubjects.has(subject) || !message || message.length > 4000) {
    return failure("Complete all required inquiry fields.", 400);
  }

  if (!process.env.RESEND_API_KEY) {
    return failure("Inquiry delivery is temporarily unavailable.", 503);
  }

  const rate = checkRateLimit(request);
  if (rate === "limited") {
    return failure("Too many inquiries. Please try again later.", 429, WINDOW_SECONDS);
  }
  const from = process.env.FRENCH_WARD_EMAIL_FROM ||
    process.env.NOTIFY_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "French-Ward <no-reply@axpt.io>";

  const content = [
    "French-Ward public inquiry", `Name: ${name}`, `Email: ${email}`,
    `Organization: ${organization}`, `Subject: ${subject}`, "", message,
  ].join("\n");

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [DESTINATION],
      subject: `FW Inquiry: ${subject}`,
      text: content,
      replyTo: email,
    });
    if (error || !data?.id) {
      console.error("[fw-inquiry] Delivery rejected", error?.name ?? "NO_PROVIDER_RECEIPT");
      return failure("Inquiry delivery is temporarily unavailable. Please try again later.", 502);
    }
    console.info("[fw-inquiry] Provider accepted inquiry", { messageId: data.id });
    return NextResponse.json({ ok: true }, {
      status: 202,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return failure("Inquiry delivery is temporarily unavailable. Please try again later.", 502);
  }
}
