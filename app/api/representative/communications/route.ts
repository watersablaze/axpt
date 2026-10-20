import { queueAdminIncomingAlert, dispatchAdminIncomingAlert } from "@/domains/admin-incoming/adminIncomingAlerts";
import {
  NextResponse,
} from "next/server";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  loadRepresentativeFieldCommunicationsWithClient,
  REPRESENTATIVE_FIELD_CONTEXT_TYPES,
  REPRESENTATIVE_FIELD_MESSAGE_TYPES,
  sendRepresentativeFieldMessageWithClient,
  type RepresentativeFieldContext,
  type RepresentativeFieldMessageType,
} from "@/domains/instruments/representative-program/communications/representativeFieldCommunications";

import {
  prisma,
} from "@/infrastructure/db/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const headers = {
  "Cache-Control":
    "private, no-store, max-age=0",
  "X-Content-Type-Options":
    "nosniff",
};

function failure(
  error: string,
  status: number,
) {
  return NextResponse.json(
    {
      ok:
        false,
      error,
    },
    {
      status,
      headers,
    },
  );
}

function field(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

export async function GET() {
  const principal =
    await getPrincipal();

  if (!principal) {
    return failure(
      "Authentication required.",
      401,
    );
  }

  try {
    const fieldState =
      await loadRepresentativeFieldCommunicationsWithClient({
        client:
          prisma,
        userId:
          principal.userId,
      });

    return NextResponse.json(
      {
        ok:
          true,
        field:
          fieldState,
      },
      {
        headers,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "ARP_FIELD_COMMUNICATIONS_PARTICIPANT_NOT_FOUND"
    ) {
      return failure(
        "Representative field unavailable.",
        404,
      );
    }

    console.error(
      "[ARP_FIELD_COMMUNICATIONS_READ_FAILED]",
    );

    return failure(
      "Representative field communications are temporarily unavailable.",
      503,
    );
  }
}

export async function POST(
  request: Request,
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return failure(
      "Authentication required.",
      401,
    );
  }

  let body:
    Record<string, unknown>;

  try {
    const parsed =
      await request.json();

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(
        parsed,
      )
    ) {
      return failure(
        "Invalid communication request.",
        400,
      );
    }

    body =
      parsed as Record<
        string,
        unknown
      >;
  } catch {
    return failure(
      "Invalid communication request.",
      400,
    );
  }

  const clientMessageId =
    field(
      body.clientMessageId,
    );

  const messageBody =
    field(
      body.body,
    );

  const type =
    field(
      body.type,
    );

  if (
    !REPRESENTATIVE_FIELD_MESSAGE_TYPES.includes(
      type as RepresentativeFieldMessageType,
    )
  ) {
    return failure(
      "Invalid communication type.",
      400,
    );
  }

  let context:
    RepresentativeFieldContext |
    undefined;

  if (
    body.context !==
      undefined &&
    body.context !==
      null
  ) {
    if (
      typeof body.context !==
        "object" ||
      Array.isArray(
        body.context,
      )
    ) {
      return failure(
        "Invalid communication context.",
        400,
      );
    }

    const rawContext =
      body.context as Record<
        string,
        unknown
      >;

    const contextType =
      field(
        rawContext.type,
      );

    if (
      !REPRESENTATIVE_FIELD_CONTEXT_TYPES.includes(
        contextType as
          RepresentativeFieldContext["type"],
      )
    ) {
      return failure(
        "Invalid communication context.",
        400,
      );
    }

    if (
      contextType ===
      "WORKSPACE"
    ) {
      context = {
        type:
          "WORKSPACE",
      };
    } else {
      const id =
        field(
          rawContext.id,
        );

      if (!id) {
        return failure(
          "Invalid communication context.",
          400,
        );
      }

      context =
        contextType ===
        "APPOINTMENT"
          ? {
              type:
                "APPOINTMENT",
              id,
            }
          : {
              type:
                "CUP_RESOURCE",
              id,
            };
    }
  }

  try {
    const result =
      await sendRepresentativeFieldMessageWithClient({
        onMessageCreated: (tx, id) => queueAdminIncomingAlert(tx, { kind: "ARP_FIELD_MESSAGE", sourceId: id }),
        client:
          prisma,
        userId:
          principal.userId,
        clientMessageId,
        type:
          type as RepresentativeFieldMessageType,
        body:
          messageBody,
        context,
      });

    await dispatchAdminIncomingAlert(prisma, { kind: "ARP_FIELD_MESSAGE", sourceId: result.message.id });

    return NextResponse.json(
      {
        ok:
          true,
        communication: {
          conversationId:
            result.conversationId,
          messageId:
            result.message.id,
          created:
            result.created,
          createdAt:
            result.message.createdAt,
        },
      },
      {
        status:
          result.created
            ? 201
            : 200,
        headers,
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.includes(
        "_INVALID",
      ) ||
      message ===
        "ARP_FIELD_COMMUNICATIONS_MESSAGE_REQUIRED"
    ) {
      return failure(
        "Invalid communication request.",
        400,
      );
    }

    if (
      message ===
        "ARP_FIELD_COMMUNICATIONS_CONTEXT_NOT_OWNED" ||
      message ===
        "ARP_FIELD_COMMUNICATIONS_PARTICIPANT_NOT_FOUND"
    ) {
      return failure(
        "Communication context unavailable.",
        404,
      );
    }

    if (
      message ===
      "ARP_FIELD_COMMUNICATIONS_IDEMPOTENCY_COLLISION"
    ) {
      return failure(
        "Communication replay conflict.",
        409,
      );
    }

    console.error(
      "[ARP_FIELD_COMMUNICATIONS_SEND_FAILED]",
    );

    return failure(
      "Unable to submit communication.",
      503,
    );
  }
}
