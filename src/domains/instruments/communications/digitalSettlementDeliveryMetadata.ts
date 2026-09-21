const FORBIDDEN_RAW_PAYLOAD_KEYS = new Set([
  "token",
  "accesstoken",
  "accessurl",
  "accesspath",
  "privateurl",
  "privateaccessurl",
  "html",
  "text",
]);

export function assertSafeDigitalSettlementDeliveryRawPayload(
  value: unknown,
  path = "rawPayload",
): void {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      assertSafeDigitalSettlementDeliveryRawPayload(
        entry,
        `${path}[${index}]`,
      ),
    );

    return;
  }

  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const normalizedKey =
      key.replace(/[_-]/g, "").toLowerCase();

    if (
      FORBIDDEN_RAW_PAYLOAD_KEYS.has(
        normalizedKey,
      )
    ) {
      throw new Error(
        `[DSI_DELIVERY_RAW_PAYLOAD_FORBIDDEN] ${path}.${key}`,
      );
    }

    assertSafeDigitalSettlementDeliveryRawPayload(
      nested,
      `${path}.${key}`,
    );
  }
}
