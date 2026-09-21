import {
  deliverDigitalSettlementEmail,
  type DigitalSettlementDeliveryResult,
} from "./deliverDigitalSettlementEmail";
import type {
  DigitalSettlementV2DeliveryRequest,
} from "./digitalSettlementV2DeliveryRequests";

export type DigitalSettlementV2DeliveryOutcome = Readonly<{
  recipientKey: DigitalSettlementV2DeliveryRequest["recipientKey"];
  grantId: string;
  deliveryKey: string;
  ok: boolean;
  result: DigitalSettlementDeliveryResult | null;
  error: string | null;
}>;

/*
 * Post-commit delivery only.
 *
 * The caller must not invoke this function until the governed V2
 * supersession + access-grant transaction has committed.
 *
 * Each recipient is attempted independently so one provider failure
 * does not obscure the outcome of the other four deliveries.
 */
export async function sendDigitalSettlementV2Deliveries(
  requests: readonly DigitalSettlementV2DeliveryRequest[],
): Promise<readonly DigitalSettlementV2DeliveryOutcome[]> {
  if (requests.length !== 5) {
    throw new Error(
      `[DSI_V2_SEND_REQUEST_COUNT_INVALID] ${requests.length}`,
    );
  }

  const outcomes: DigitalSettlementV2DeliveryOutcome[] = [];

  for (const request of requests) {
    try {
      const result =
        await deliverDigitalSettlementEmail(
          request.input,
        );

      outcomes.push({
        recipientKey:
          request.recipientKey,
        grantId:
          request.grantId,
        deliveryKey:
          request.deliveryKey,
        ok: true,
        result,
        error: null,
      });
    } catch (error) {
      outcomes.push({
        recipientKey:
          request.recipientKey,
        grantId:
          request.grantId,
        deliveryKey:
          request.deliveryKey,
        ok: false,
        result: null,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return outcomes;
}
