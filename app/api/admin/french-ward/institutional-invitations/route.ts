import "server-only";

import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import {
  issueFrenchWardInstitutionalInvitationWithClient,
} from "@/domains/institutions/french-ward/participants/invitations/issueFrenchWardInstitutionalInvitationWithClient";

import {
  dispatchFrenchWardInstitutionalInvitationWithClient,
} from "@/domains/institutions/french-ward/participants/invitations/dispatchFrenchWardInstitutionalInvitationWithClient";

export const runtime = "nodejs";

function json(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function stringField(
  record: Record<string, unknown>,
  field: string,
  max: number,
): string | null {
  const value = record[field];

  if (typeof value !== "string") return null;

  const normalized = value.trim();

  if (!normalized || normalized.length > max) {
    return null;
  }

  return normalized;
}

function optionalField(
  record: Record<string, unknown>,
  field: string,
  max: number,
): string | null | undefined {
  const value = record[field];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") return undefined;

  const normalized = value.trim();

  if (normalized.length > max) return undefined;

  return normalized || null;
}

export async function POST(request: Request) {
  /*
   * Require a same-origin browser request.
   * This is independent of authenticated session authority.
   */
  const origin = request.headers.get("origin");

  if (
    !origin ||
    origin !== new URL(request.url).origin
  ) {
    return json(
      { ok: false, error: "Invalid request origin" },
      403,
    );
  }

  const principal = await getPrincipal();

  if (!principal) {
    return json(
      { ok: false, error: "Authentication required" },
      401,
    );
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE,
    )
  ) {
    return json(
      { ok: false, error: "Not authorized" },
      403,
    );
  }

  const from =
    process.env.FRENCH_WARD_EMAIL_FROM ||
    process.env.DSI_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  /*
   * Never issue a credential for email delivery when the
   * provider is already known to be unavailable.
   */
  if (!from || !process.env.RESEND_API_KEY) {
    return json(
      {
        ok: false,
        error: "Institutional email is not configured",
      },
      503,
    );
  }

  /*
   * The Content-Length header is not authoritative.
   * Enforce the limit against bytes actually received.
   */
  const maxBodyBytes = 16384;

  const declaredLength =
    request.headers.get("content-length");

  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);

    if (
      !Number.isSafeInteger(parsedLength) ||
      parsedLength < 0
    ) {
      return json(
        { ok: false, error: "Invalid content length" },
        400,
      );
    }

    if (parsedLength > maxBodyBytes) {
      return json(
        { ok: false, error: "Request too large" },
        413,
      );
    }
  }

  let body: unknown;
  const reader = request.body?.getReader();

  if (!reader) {
    return json(
      { ok: false, error: "Invalid JSON" },
      400,
    );
  }

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      receivedBytes += value.byteLength;

      if (receivedBytes > maxBodyBytes) {
        void reader.cancel().catch(() => undefined);

        return json(
          { ok: false, error: "Request too large" },
          413,
        );
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(receivedBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const decoded = new TextDecoder(
      "utf-8",
      { fatal: true },
    ).decode(bytes);

    body = JSON.parse(decoded);
  } catch {
    return json(
      { ok: false, error: "Invalid JSON" },
      400,
    );
  } finally {
    reader.releaseLock();
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return json(
      { ok: false, error: "Invalid request" },
      400,
    );
  }

  const input = body as Record<string, unknown>;

  const allowedFields = new Set([
    "reference",
    "recipientEmail",
    "recipientDisplayName",
    "participantReference",
    "institutionalTitle",
    "secondaryTitle",
    "capacityClass",
    "recognitionBasis",
    "provenanceReference",
    "expiresAt",
    "deliveryKey",
  ]);

  if (
    Object.keys(input).some(
      field => !allowedFields.has(field),
    )
  ) {
    return json(
      { ok: false, error: "Unsupported request fields" },
      400,
    );
  }

  const reference =
    stringField(input, "reference", 191);

  const recipientEmail =
    stringField(input, "recipientEmail", 254)
      ?.toLowerCase();

  const recipientDisplayName =
    stringField(input, "recipientDisplayName", 191);

  const participantReference =
    stringField(input, "participantReference", 191);

  const institutionalTitle =
    stringField(input, "institutionalTitle", 191);

  const recognitionBasis =
    stringField(input, "recognitionBasis", 3000);

  const secondaryTitle =
    optionalField(input, "secondaryTitle", 191);

  const provenanceReference =
    optionalField(input, "provenanceReference", 191);

  const deliveryKey =
    stringField(input, "deliveryKey", 128);

  const capacityClass =
    input.capacityClass;

  const expiryValue =
    input.expiresAt;

  const expiresAt =
    typeof expiryValue === "string"
      ? new Date(expiryValue)
      : new Date(NaN);

  const now = new Date();

  if (
    !reference ||
    !recipientEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) ||
    !recipientDisplayName ||
    !participantReference ||
    !institutionalTitle ||
    !recognitionBasis ||
    secondaryTitle === undefined ||
    provenanceReference === undefined ||
    !deliveryKey ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(deliveryKey) ||
    (
      capacityClass !== "STRATEGIC" &&
      capacityClass !== "OPERATIONS" &&
      capacityClass !== "FIDUCIARY"
    ) ||
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt <= now ||
    expiresAt.getTime() > now.getTime() + 30 * 86400000
  ) {
    return json(
      { ok: false, error: "Invalid invitation particulars" },
      400,
    );
  }

  /*
   * The raw credential exists only in this server-side
   * issuance → dispatch sequence.
   *
   * It is never returned to the administrator's browser.
   */
  let issued:
    Awaited<
      ReturnType<
        typeof issueFrenchWardInstitutionalInvitationWithClient
      >
    >;

  try {
    issued =
      await issueFrenchWardInstitutionalInvitationWithClient({
        client: prisma,
        input: {
          reference,
          recipientEmail,
          recipientDisplayName,
          participantReference,
          institutionalTitle,
          secondaryTitle,
          capacityClass,
          recognitionBasis,
          provenanceReference,
          expiresAt,
          issuedByUserId: principal.userId,
          deliveryKey,
          now,
        },
      });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (
      message.includes("ISSUER_NOT_AUTHORIZED")
    ) {
      return json(
        { ok: false, error: "Not authorized" },
        403,
      );
    }

    if (
      message.includes("REFERENCE_ALREADY_ISSUED") ||
      message.includes("PENDING_FOR_PARTICIPANT") ||
      message.includes("Unique constraint")
    ) {
      return json(
        {
          ok: false,
          error: "Invitation conflicts with existing state",
        },
        409,
      );
    }

    return json(
      { ok: false, error: "Invitation could not be issued" },
      500,
    );
  }

  const invitationId = issued.invitation.id;

  try {
    const delivery =
      await dispatchFrenchWardInstitutionalInvitationWithClient({
        client: prisma,
        invitationId,
        actorUserId: principal.userId,
        deliveryKey,
        credential: issued.credential,
        from,
        now,
        send: async mail => {
          const response = await resend.emails.send(
            {
              from: mail.from,
              to: mail.to,
              replyTo: mail.replyTo,
              subject: mail.subject,
              text: mail.text,
              html: mail.html,
            },
            {
              idempotencyKey: mail.idempotencyKey,
            },
          );

          return {
            data: response.data,
            error: response.error,
          };
        },
      });

    const deliveryAccepted =
      delivery.status === "PROVIDER_ACCEPTED";

    return json(
      {
        ok: deliveryAccepted,
        invitationIssued: true,
        deliveryAccepted,
        invitationId,
        reference,
        deliveryKey,
        deliveryStatus: delivery.status,
        providerMessageId: delivery.providerMessageId,
      },
      deliveryAccepted ? 200 : 202,
    );
  } catch {
    /*
     * Issuance committed before this failure.
     * Never claim the entire operation rolled back.
     *
     * The credential cannot be reconstructed. Any unresolved
     * delivery requires an administrative reconciliation.
     */
    return json(
      {
        ok: false,
        invitationIssued: true,
        deliveryAccepted: false,
        invitationId,
        reference,
        deliveryKey,
        deliveryStatus: "RECONCILIATION_REQUIRED",
        error: "Invitation issued; delivery requires reconciliation",
      },
      202,
    );
  }
}
