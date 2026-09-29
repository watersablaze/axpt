import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  institutionalInstrumentAccessCookieName,
} from "@/domains/instruments/access/accessToken";

import {
  INSTRUMENT_RESPONSE_TYPE,
  type InstrumentResponseType,
} from "@/domains/instruments/contracts";

import {
  submitInstrumentResponseWithTokenWithClient,
} from "@/domains/instruments/commands/submitInstrumentResponseWithTokenWithClient";

import {
  loadInstrumentDeliberationWithClient,
} from "@/domains/instruments/queries/loadInstrumentDeliberationWithClient";

import {
  runInstrumentGovernanceTransaction,
} from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";

import { prisma } from "@/infrastructure/db/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { resolveInstitutionalInstrumentAccessWithClient } from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";

const GM_REFERENCE =
  "GM-KENYA-RCF-001";

function isInstrumentResponseType(
  value: unknown,
): value is InstrumentResponseType {
  return (
    typeof value === "string" &&
    Object.values(
      INSTRUMENT_RESPONSE_TYPE,
    ).includes(
      value as InstrumentResponseType,
    )
  );
}

function asOptionalNote(
  value: unknown,
) {
  if (typeof value !== "string") {
    return undefined;
  }

  const note =
    value.trim();

  return note ||
    undefined;
}

export async function POST(
  request: Request,
) {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      institutionalInstrumentAccessCookieName(
        GM_REFERENCE,
      ),
    )?.value ?? null;

  /*
   * Admin inspection authority is intentionally
   * irrelevant here.
   *
   * A durable external response requires a valid
   * identity-bound InstrumentAccessGrant.
   */
  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "CONTROLLED_INSTRUMENT_ACCESS_REQUIRED",
      },
      {
        status: 401,
      },
    );
  }

  // V2 is a sealed, seven-position act. The legacy single-position route
  // remains available only for the earlier V1 deliberation.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ ok: false, error: "ORIGIN_REQUIRED" }, { status: 403 });
  }
  const [principal, access] = await Promise.all([
    getPrincipal(),
    resolveInstitutionalInstrumentAccessWithClient({
      client: prisma, instrumentReference: GM_REFERENCE, token, recordAccess: false,
    }),
  ]);
  if (!access || !principal || principal.userId !== access.grant.recipientUserId) {
    return NextResponse.json({ ok: false, error: "RECIPIENT_SESSION_REQUIRED" }, { status: 403 });
  }
  if (access.instrument.currentVersion !== 1 || access.grant.instrumentVersionId) {
    return NextResponse.json({ ok: false, error: "USE_V2_RESPONSE_SET" }, { status: 409 });
  }

  let body: unknown;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_RESPONSE_PAYLOAD",
      },
      {
        status: 400,
      },
    );
  }

  if (
    typeof body !== "object" ||
    body === null
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_RESPONSE_PAYLOAD",
      },
      {
        status: 400,
      },
    );
  }

  const input =
    body as Record<
      string,
      unknown
    >;

  const propositionReference =
    typeof input.propositionReference ===
      "string"
      ? input.propositionReference.trim()
      : "";

  if (!propositionReference) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "PROPOSITION_REFERENCE_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  if (
    !isInstrumentResponseType(
      input.responseType,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "INVALID_RESPONSE_TYPE",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const submission =
      await runInstrumentGovernanceTransaction(
        prisma,
        async (tx) => {
          return submitInstrumentResponseWithTokenWithClient({
            client:
              tx,
            instrumentReference:
              GM_REFERENCE,
            token,
            propositionReference,
            responseType:
              input.responseType,
            note:
              asOptionalNote(
                input.note,
              ),
            correlationId:
              randomUUID(),
          });
        },
      );

    /*
     * Read projection happens only after the durable
     * transaction commits.
     */
    const deliberation =
      await loadInstrumentDeliberationWithClient({
        client:
          prisma,
        instrumentReference:
          GM_REFERENCE,
        actorUserId:
          submission.access.actorUserId,
      });

    if (!deliberation) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "DELIBERATION_PROJECTION_NOT_FOUND",
        },
        {
          status: 500,
        },
      );
    }

    const proposition =
      deliberation.propositions.find(
        (candidate) =>
          candidate.reference ===
          propositionReference,
      );

    if (!proposition) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PROPOSITION_PROJECTION_NOT_FOUND",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      ok:
        true,

      actorUserId:
        submission.access
          .actorUserId,

      proposition: {
        reference:
          proposition.reference,
        state:
          proposition.state,
        resolution:
          proposition.resolution,

        response:
          proposition.response
            ? {
                id:
                  proposition.response.id,
                responseType:
                  proposition.response
                    .responseType,
                note:
                  proposition.response.note,
                createdAt:
                  proposition.response
                    .createdAt
                    .toISOString(),
              }
            : null,
      },

      summary:
        deliberation.summary,
    });
  } catch (error) {
    console.error(
      "[gm/respond] durable response submission failed",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    const controlledFailure =
      message.includes(
        "INSTRUMENT_RESPONSE_ACCESS",
      ) ||
      message.includes(
        "INSTRUMENT_RESPONSE_IDENTITY",
      ) ||
      message.includes(
        "INSTRUMENT_ACCESS",
      );

    return NextResponse.json(
      {
        ok:
          false,
        error:
          controlledFailure
            ? "CONTROLLED_INSTRUMENT_RESPONSE_REJECTED"
            : "INSTRUMENT_RESPONSE_SUBMISSION_FAILED",
      },
      {
        status:
          controlledFailure
            ? 403
            : 500,
      },
    );
  }
}
