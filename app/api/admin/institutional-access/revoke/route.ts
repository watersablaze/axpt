import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { revokeInstitutionalAccessWithClient } from "@/domains/institutional-access/consumeInstitutionalAccessWithClient";
import { prisma } from "@/infrastructure/db/prisma";

export async function POST(
  request: Request,
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Authentication required",
      },
      {
        status: 401,
      },
    );
  }

  if (
    !principal.permissions.includes(
      PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE,
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Not authorized",
      },
      {
        status: 403,
      },
    );
  }

  try {
    const input: unknown =
      await request.json();

    if (
      !input ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid request",
        },
        {
          status: 400,
        },
      );
    }

    const body =
      input as Record<
        string,
        unknown
      >;

    const grantId =
      typeof body.grantId ===
      "string"
        ? body.grantId.trim()
        : "";

    const reason =
      typeof body.reason ===
      "string"
        ? body.reason.trim()
        : "";

    if (
      !grantId ||
      grantId.length > 191 ||
      !reason ||
      reason.length > 3000
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Grant and reason required",
        },
        {
          status: 400,
        },
      );
    }

    const grant =
      await prisma.institutionalAccessGrant.findUnique({
        where: {
          id: grantId,
        },
        select: {
          id: true,
          scope: true,
        },
      });

    if (!grant) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Grant not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      ![
        "PROFILE_VIEW",
        "SOURCE_AUTHORITY_VIEW",
        "SUPPORTING_DOCUMENT_VIEW",
        "LOI_INTAKE_ACCESS",
      ].includes(grant.scope)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Unsupported access scope.",
        },
        {
          status: 409,
        },
      );
    }

    const result =
      await revokeInstitutionalAccessWithClient({
        client: prisma,
        actor: principal,
        grantId,
        reason,
      });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.startsWith(
        "MISSING_PERMISSION:",
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Not authorized",
        },
        {
          status: 403,
        },
      );
    }

    if (
      message ===
      "INSTITUTIONAL_ACCESS_GRANT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Grant not found.",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "[institutional-access:revoke]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Revocation could not be recorded.",
      },
      {
        status: 409,
      },
    );
  }
}
