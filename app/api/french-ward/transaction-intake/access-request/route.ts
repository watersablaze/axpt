import { queueAdminIncomingAlert, dispatchAdminIncomingAlert } from "@/domains/admin-incoming/adminIncomingAlerts";
import {
  NextResponse,
} from "next/server";

import {
  requestInstitutionalAccessWithClient,
} from "@/domains/institutional-access/manageInstitutionalAccessWithClient";

import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "@/domains/institutions/french-ward/commercial";

import {
  prisma,
} from "@/infrastructure/db/prisma";

function field(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export async function POST(
  request:
    Request,
) {
  try {
    const body =
      await request.json();

    const result =
      await requestInstitutionalAccessWithClient(
        {
          onRequested: (tx, id) => queueAdminIncomingAlert(tx, { kind: "LOI_ACCESS_REQUEST", sourceId: id }),
          client:
            prisma,

          requesterName:
            field(
              body.requesterName,
            ),

          requesterEmail:
            field(
              body.requesterEmail,
            ),

          institutionalAffiliation:
            field(
              body.institutionalAffiliation,
            ),

          requesterCapacity:
            field(
              body.requesterCapacity,
            ),

          purpose:
            field(
              body.purpose,
            ),

          /*
           * Server-owned access coordinates.
           * Public request fields cannot select or alter these.
           */
          scope:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .accessScope,

          resourceReference:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .reference,

          resourceVersion:
            FRENCH_WARD_COMMERCIAL_INTAKE
              .version,
        },
      );

    await dispatchAdminIncomingAlert(prisma, { kind: "LOI_ACCESS_REQUEST", sourceId: result.id });
    return NextResponse.json(
      {
        ok:
          true,

        request: {
          id:
            result.id,

          status:
            result.status,
        },
      },
      {
        status:
          201,
      },
    );
  } catch (error) {
    console.error(
      "[transaction-intake:access-request]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    const clientError =
      message.startsWith(
        "REQUIRED:",
      ) ||
      message ===
        "INVALID_REQUESTER_EMAIL";

    return NextResponse.json(
      {
        ok:
          false,

        error:
          clientError
            ? "Complete all required access-request fields with a valid email address."
            : "Unable to submit commercial intake access request.",
      },
      {
        status:
          clientError
            ? 400
            : 500,
      },
    );
  }
}
