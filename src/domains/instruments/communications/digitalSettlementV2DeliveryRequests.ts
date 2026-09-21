import type {
  DigitalSettlementV2Delivery,
} from "./digitalSettlementV2DeliveryAssembly";
type DigitalSettlementV2OutboundEmail = Readonly<{
  type: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  rawPayload: Record<string, unknown>;
}>;

export type DigitalSettlementV2DeliveryRequest = Readonly<{
  recipientKey: DigitalSettlementV2Delivery["key"];
  grantId: string;
  deliveryKey: string;
  input: DigitalSettlementV2OutboundEmail;
}>;

export function buildDigitalSettlementV2DeliveryRequests(
  deliveries: readonly DigitalSettlementV2Delivery[],
): readonly DigitalSettlementV2DeliveryRequest[] {
  if (deliveries.length !== 5) {
    throw new Error(
      `[DSI_V2_DELIVERY_REQUEST_COUNT_INVALID] ${deliveries.length}`,
    );
  }

  const keys = new Set<string>();
  const grantIds = new Set<string>();

  return deliveries.map((delivery) => {
    if (keys.has(delivery.key)) {
      throw new Error(
        `[DSI_V2_DELIVERY_REQUEST_DUPLICATE_RECIPIENT] ${delivery.key}`,
      );
    }

    if (grantIds.has(delivery.grantId)) {
      throw new Error(
        `[DSI_V2_DELIVERY_REQUEST_DUPLICATE_GRANT] ${delivery.grantId}`,
      );
    }

    keys.add(delivery.key);
    grantIds.add(delivery.grantId);

    const deliveryKey =
      `DSI_V2_${delivery.instrumentVersionNumber}` +
      `_${delivery.grantId}_${delivery.key}`;

    return {
      recipientKey: delivery.key,
      grantId: delivery.grantId,
      deliveryKey,
      input: {
        type: deliveryKey,
        to: delivery.email,
        subject: delivery.subject,
        text: delivery.text,
        html: delivery.html,

        /*
         * Durable delivery metadata deliberately excludes:
         * token
         * accessPath
         * accessUrl
         * text
         * html
         */
        rawPayload: {
          reference:
            delivery.instrumentReference,
          version:
            delivery.instrumentVersionNumber,
          recipientKey:
            delivery.key,
          grantId:
            delivery.grantId,
        },
      },
    };
  });
}
