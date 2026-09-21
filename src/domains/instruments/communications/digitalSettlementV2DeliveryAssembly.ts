import {
  DSI_PUBLIC_ID,
  DSI_REFERENCE,
} from "../definitions/digitalSettlementV1Definition";
import {
  DSI_V2_VERSION,
  type DigitalSettlementV2RecipientKey,
} from "../definitions/digitalSettlementV2FinancierRevision";
import type { DigitalSettlementV2IssuedAccessGrant } from "../commands/issueDigitalSettlementV2AccessGrantsWithClient";
import { buildDigitalSettlementV2EmailPreviews } from "./digitalSettlementV2Preview";

export type DigitalSettlementV2Delivery = Readonly<{
  key: DigitalSettlementV2RecipientKey;
  recipientName: string;
  email: string;
  grantId: string;
  instrumentReference: typeof DSI_REFERENCE;
  instrumentVersionNumber: typeof DSI_V2_VERSION;
  accessPath: string;
  accessUrl: string;
  audience: "ACTIVE" | "REVIEW" | "INTERNAL";
  subject: string;
  heading: string;
  authority: string;
  ctaLabel: string;
  text: string;
  html: string;
}>;

const REQUIRED_KEYS: readonly DigitalSettlementV2RecipientKey[] = [
  "financier",
  "buyerRepresentative",
  "externalReviewer",
  "bobby",
  "lawrence",
];

function normalizeOrigin(origin: string) {
  const trimmed = origin.trim();

  if (!trimmed) {
    throw new Error(
      "[DSI_V2_DELIVERY_ORIGIN_REQUIRED]",
    );
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "[DSI_V2_DELIVERY_ORIGIN_INVALID]",
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
      "[DSI_V2_DELIVERY_ORIGIN_INVALID]",
    );
  }

  return parsed.origin;
}

export function buildDigitalSettlementV2Deliveries(params: {
  origin: string;
  grants: readonly DigitalSettlementV2IssuedAccessGrant[];
}): readonly DigitalSettlementV2Delivery[] {
  const origin = normalizeOrigin(params.origin);

  if (params.grants.length !== 5) {
    throw new Error(
      `[DSI_V2_DELIVERY_GRANT_COUNT_INVALID] ${params.grants.length}`,
    );
  }

  const grantsByKey =
    new Map<
      DigitalSettlementV2RecipientKey,
      DigitalSettlementV2IssuedAccessGrant
    >();

  for (const grant of params.grants) {
    if (grantsByKey.has(grant.key)) {
      throw new Error(
        `[DSI_V2_DELIVERY_DUPLICATE_RECIPIENT] ${grant.key}`,
      );
    }

    if (
      grant.instrumentVersion.number !==
        DSI_V2_VERSION ||
      grant.grant.instrumentVersionId !==
        grant.instrumentVersion.id
    ) {
      throw new Error(
        `[DSI_V2_DELIVERY_VERSION_BINDING_INVALID] ${grant.key}`,
      );
    }

    if (!grant.token.trim()) {
      throw new Error(
        `[DSI_V2_DELIVERY_TOKEN_REQUIRED] ${grant.key}`,
      );
    }

    grantsByKey.set(grant.key, grant);
  }

  for (const key of REQUIRED_KEYS) {
    if (!grantsByKey.has(key)) {
      throw new Error(
        `[DSI_V2_DELIVERY_RECIPIENT_MISSING] ${key}`,
      );
    }
  }

  const accessPaths =
    {} as Record<
      DigitalSettlementV2RecipientKey,
      string
    >;

  const accessUrls =
    {} as Record<
      DigitalSettlementV2RecipientKey,
      string
    >;

  for (const key of REQUIRED_KEYS) {
    const grant = grantsByKey.get(key);

    if (!grant) {
      throw new Error(
        `[DSI_V2_DELIVERY_RECIPIENT_MISSING] ${key}`,
      );
    }

    const accessPath =
      `/french-ward/instruments/${DSI_PUBLIC_ID}` +
      `/access/${grant.token}`;

    accessPaths[key] = accessPath;
    accessUrls[key] =
      `${origin}${accessPath}`;
  }

  const rendered =
    buildDigitalSettlementV2EmailPreviews({
      accessUrls,
    });

  if (rendered.length !== 5) {
    throw new Error(
      `[DSI_V2_DELIVERY_MESSAGE_COUNT_INVALID] ${rendered.length}`,
    );
  }

  return rendered.map((message) => {
    const grant =
      grantsByKey.get(message.recipientKey);

    if (!grant) {
      throw new Error(
        `[DSI_V2_DELIVERY_GRANT_MISSING] ${message.recipientKey}`,
      );
    }

    if (
      message.recipient.name !==
        grant.recipientName ||
      message.recipient.email !==
        grant.email
    ) {
      throw new Error(
        `[DSI_V2_DELIVERY_RECIPIENT_MISMATCH] ${message.recipientKey}`,
      );
    }

    return {
      key: message.recipientKey,
      recipientName: grant.recipientName,
      email: grant.email,
      grantId: grant.grant.id,
      instrumentReference: DSI_REFERENCE,
      instrumentVersionNumber:
        DSI_V2_VERSION,
      accessPath:
        accessPaths[message.recipientKey],
      accessUrl: message.accessUrl,
      audience: message.audience,
      subject: message.subject,
      heading: message.heading,
      authority: message.authority,
      ctaLabel: message.ctaLabel,
      text: message.text,
      html: message.html,
    };
  });
}
