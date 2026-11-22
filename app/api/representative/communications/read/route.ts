import { NextResponse } from "next/server";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  markRepresentativeFieldReadWithClient,
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
      ok: false,
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
      Array.isArray(parsed)
    ) {
      return failure(
        "Invalid read acknowledgement.",
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
      "Invalid read acknowledgement.",
      400,
    );
  }

  const throughMessageId =
    field(
      body.throughMessageId,
    );

  if (
    !throughMessageId ||
    Object.keys(body).some(
      (key) =>
        key !==
        "throughMessageId",
    )
  ) {
    return failure(
      "Invalid read acknowledgement.",
      400,
    );
  }

  try {
    const result =
      await markRepresentativeFieldReadWithClient({
        client:
          prisma,
        userId:
          principal.userId,
        throughMessageId,
      });

    return NextResponse.json(
      {
        ok: true,
        read: {
          conversationId:
            result.conversationId,
          lastReadMessageId:
            result.lastReadMessageId,
          lastReadAt:
            result.lastReadAt,
        },
      },
      {
        headers,
      },
    );
  } catch (error) {
    const code =
      error instanceof Error
        ? error.message
        : "";

    if (
      code ===
        "ARP_FIELD_READ_MESSAGE_ID_INVALID"
    ) {
      return failure(
        "Invalid read acknowledgement.",
        400,
      );
    }

    if (
      code ===
        "ARP_FIELD_COMMUNICATIONS_PARTICIPANT_NOT_FOUND" ||
      code ===
        "ARP_FIELD_COMMUNICATIONS_ROOM_NOT_FOUND" ||
      code ===
        "COMMUNICATION_READ_MESSAGE_NOT_FOUND"
    ) {
      return failure(
        "Field communication unavailable.",
        404,
      );
    }

    if (
      code ===
        "COMMUNICATION_READ_STATE_REGRESSION_NOT_ALLOWED"
    ) {
      return failure(
        "Read acknowledgement would move backward.",
        409,
      );
    }

    if (
      code ===
        "ARP_FIELD_COMMUNICATIONS_ROOM_TOPOLOGY_CONFLICT" ||
      code ===
        "ARP_FIELD_COMMUNICATIONS_MEMBERSHIP_CONFLICT" ||
      code ===
        "COMMUNICATION_CONVERSATION_ACCESS_DENIED"
    ) {
      return failure(
        "Field communication cannot be acknowledged in its current state.",
        409,
      );
    }

    console.error(
      "[ARP_FIELD_COMMUNICATIONS_READ_ACK_FAILED]",
    );

    return failure(
      "Unable to acknowledge field communication.",
      503,
    );
  }
}
