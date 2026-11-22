import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "../definitions/digitalSettlementV1Definition";
import {
  DSI_V2_VERSION,
  type DigitalSettlementV2RecipientKey,
} from "../definitions/digitalSettlementV2FinancierRevision";
import {
  buildDigitalSettlementV2EmailForRecipient,
} from "./digitalSettlementV2Preview";

function normalizeOrigin(origin: string) {
  const trimmed = origin.trim();

  if (!trimmed) {
    throw new Error(
      "[DSI_V2_RECOVERY_DELIVERY_ORIGIN_REQUIRED]",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "[DSI_V2_RECOVERY_DELIVERY_ORIGIN_INVALID]",
    );
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      "[DSI_V2_RECOVERY_DELIVERY_ORIGIN_INVALID]",
    );
  }

  return parsed.origin;
}

export type DigitalSettlementV2RecoveredGrant = Readonly<{
  key: DigitalSettlementV2RecipientKey;
  recipientName: string;
  email: string;
  replacedGrantId: string;
  grant: Readonly<{
    id: string;
    instrumentVersionId: string | null;
    recipientName: string | null;
    accessLevel: string;
    expiresAt: Date | null;
  }>;
  token: string;
  instrumentVersion: Readonly<{
    id: string;
    number: number;
    status: string;
  }>;
}>;

export function buildDigitalSettlementV2RecoveryDelivery(params: {
  origin: string;
  recovery: DigitalSettlementV2RecoveredGrant;
}) {
  const origin = normalizeOrigin(params.origin);
  const recovery = params.recovery;

  if (
    recovery.instrumentVersion.number !==
      DSI_V2_VERSION ||
    recovery.grant.instrumentVersionId !==
      recovery.instrumentVersion.id
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_DELIVERY_VERSION_BINDING_INVALID] ${recovery.key}`,
    );
  }

  if (!recovery.token.trim()) {
    throw new Error(
      `[DSI_V2_RECOVERY_DELIVERY_TOKEN_REQUIRED] ${recovery.key}`,
    );
  }

  const accessPath =
    `/french-ward/instruments/${DSI_PUBLIC_ID}` +
    `/access/${recovery.token}`;

  const accessUrl =
    `${origin}${accessPath}`;

  const message =
    buildDigitalSettlementV2EmailForRecipient({
      recipientKey: recovery.key,
      accessUrl,
    });

  if (
    message.recipient.name !==
      recovery.recipientName ||
    message.recipient.email !==
      recovery.email
  ) {
    throw new Error(
      `[DSI_V2_RECOVERY_DELIVERY_RECIPIENT_MISMATCH] ${recovery.key}`,
    );
  }

  const deliveryKey =
    `DSI_V2_${DSI_V2_VERSION}` +
    `_${recovery.grant.id}_${recovery.key}`;

  return {
    recipientKey: recovery.key,
    replacedGrantId:
      recovery.replacedGrantId,
    grantId:
      recovery.grant.id,
    deliveryKey,
    accessPath,
    accessUrl,
    input: {
      type: deliveryKey,
      to: recovery.email,
      subject: message.subject,
      text: message.text,
      html: message.html,

      rawPayload: {
        reference:
          DSI_REFERENCE,
        version:
          DSI_V2_VERSION,
        recipientKey:
          recovery.key,
        grantId:
          recovery.grant.id,
        recoveryOfGrantId:
          recovery.replacedGrantId,
      },
    },
  } as const;
}
