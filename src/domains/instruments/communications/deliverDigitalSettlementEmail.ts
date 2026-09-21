import { prisma } from "@/infrastructure/db/prisma";
import { resend } from "@/infrastructure/email/client";

import { getDigitalSettlementEmailMode } from "./emailMode";
import { getDigitalSettlementSender } from "./digitalSettlementSender";
import { assertSafeDigitalSettlementDeliveryRawPayload } from "./digitalSettlementDeliveryMetadata";

export type DigitalSettlementDeliveryInput = Readonly<{
  type: string;
  to: string | readonly string[];
  subject: string;
  text: string;
  html: string;
  rawPayload: Record<string, unknown>;
}>;

export type DigitalSettlementDeliveryResult =
  | Readonly<{
      ok: true;
      mode: "log";
      alreadyDelivered?: boolean;
      messageId?: string | null;
    }>
  | Readonly<{
      ok: true;
      mode: "send";
      alreadyDelivered?: boolean;
      messageId: string | null;
    }>;

function extractResendError(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    response.error
  ) {
    return response.error;
  }

  return null;
}

function extractResendMessageId(response: unknown) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    response.data &&
    typeof response.data === "object" &&
    "id" in response.data
  ) {
    return String(response.data.id);
  }

  return null;
}


/*
 * Infrastructure-level delivery primitive.
 *
 * This function:
 * - does not create or mutate instrument/domain state;
 * - does not create access grants;
 * - rejects bearer/message material from persisted rawPayload;
 * - performs one external delivery attempt only;
 * - records delivery evidence in EmailLog;
 * - treats a prior successful delivery with the same
 *   type + recipient + subject as idempotently complete.
 *
 * Callers are responsible for ensuring rawPayload contains no
 * private bearer token, access URL, rendered HTML, or message text.
 */
export async function deliverDigitalSettlementEmail(
  input: DigitalSettlementDeliveryInput,
): Promise<DigitalSettlementDeliveryResult> {
  const type = input.type.trim();
  const subject = input.subject.trim();

  const recipients = (
    Array.isArray(input.to)
      ? [...input.to]
      : [input.to]
  )
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  if (!type) {
    throw new Error(
      "[DSI_DELIVERY_TYPE_REQUIRED]",
    );
  }

  if (!subject) {
    throw new Error(
      "[DSI_DELIVERY_SUBJECT_REQUIRED]",
    );
  }

  if (recipients.length === 0) {
    throw new Error(
      "[DSI_DELIVERY_RECIPIENT_REQUIRED]",
    );
  }

  if (!input.text.trim()) {
    throw new Error(
      "[DSI_DELIVERY_TEXT_REQUIRED]",
    );
  }

  if (!input.html.trim()) {
    throw new Error(
      "[DSI_DELIVERY_HTML_REQUIRED]",
    );
  }

  assertSafeDigitalSettlementDeliveryRawPayload(
    input.rawPayload,
  );

  const mode =
    getDigitalSettlementEmailMode();

  const from =
    getDigitalSettlementSender();

  const toLog =
    recipients.join(",");

  const successfulStatus =
    mode === "log"
      ? "LOGGED_ONLY"
      : "SENT";

  const existingDelivery =
    await prisma.emailLog.findFirst({
      where: {
        type,
        to: toLog,
        subject,
        status: successfulStatus,
      },
      select: {
        id: true,
        status: true,
        messageId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  if (existingDelivery) {
    return {
      ok: true,
      mode,
      alreadyDelivered: true,
      messageId:
        existingDelivery.messageId,
    };
  }

  if (mode === "log") {
    await prisma.emailLog.create({
      data: {
        type,
        from,
        to: toLog,
        subject,
        messageId: null,
        status: "LOGGED_ONLY",
        rawPayload: {
          mode: "log",
          ...input.rawPayload,
        },
      },
    });

    return {
      ok: true,
      mode: "log",
    };
  }

  const response =
    await resend.emails.send({
      from,
      to: recipients,
      replyTo:
        process.env.DSI_REPLY_TO_EMAIL ||
        "french-ward@axpt.io",
      subject,
      text: input.text,
      html: input.html,
    });

  const error =
    extractResendError(response);

  const messageId =
    extractResendMessageId(response);

  await prisma.emailLog.create({
    data: {
      type,
      from,
      to: toLog,
      subject,
      messageId,
      status: error ? "FAILED" : "SENT",
      rawPayload: {
        response,
        error,
        ...input.rawPayload,
      },
    },
  });

  if (error) {
    throw new Error(
      `[DSI_EMAIL_SEND_FAILED] ${JSON.stringify(error)}`,
    );
  }

  return {
    ok: true,
    mode: "send",
    messageId,
  };
}
