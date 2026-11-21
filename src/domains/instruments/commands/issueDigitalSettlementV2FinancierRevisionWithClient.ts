import {
  issueDigitalSettlementV2AccessGrantsWithClient,
  type DigitalSettlementV2AccessGrantIssuanceClient,
} from "./issueDigitalSettlementV2AccessGrantsWithClient";
import {
  supersedeDigitalSettlementWithV2FinancierRevisionWithClient,
  type DigitalSettlementV2SupersessionClient,
} from "./supersedeDigitalSettlementWithV2FinancierRevisionWithClient";

export type DigitalSettlementV2FinancierRevisionIssuanceClient =
  DigitalSettlementV2SupersessionClient &
  DigitalSettlementV2AccessGrantIssuanceClient;

/*
 * Atomic database half of governed DSI V2 issuance.
 *
 * This command does not open its own transaction. The caller must invoke
 * it inside one Prisma transaction so supersession, five access grants,
 * and their domain events either all commit or all roll back.
 *
 * This is intentionally INITIAL-TRANSITION ONLY.
 *
 * If V2 already exists as the current issued version, this command will
 * not create replacement access grants. Delivery recovery must use a
 * separate governed recovery path.
 *
 * No email or other external side effect belongs in this command.
 */
export async function issueDigitalSettlementV2FinancierRevisionWithClient(
  params: {
    client: DigitalSettlementV2FinancierRevisionIssuanceClient;
    instrumentReference: string;
    actorUserId: string;
    accessExpiresAt: Date;
  },
) {
  const supersession =
    await supersedeDigitalSettlementWithV2FinancierRevisionWithClient({
      client: params.client,
      instrumentReference:
        params.instrumentReference,
      actorUserId:
        params.actorUserId,
    });

  if (!supersession.transitioned) {
    throw new Error(
      "[DSI_V2_ISSUANCE_ALREADY_COMPLETED]",
    );
  }

  const grants =
    await issueDigitalSettlementV2AccessGrantsWithClient({
      client: params.client,
      instrumentReference:
        params.instrumentReference,
      issuedByUserId:
        params.actorUserId,
      expiresAt:
        params.accessExpiresAt,
    });

  if (grants.length !== 5) {
    throw new Error(
      `[DSI_V2_ISSUANCE_GRANT_COUNT_INVALID] ${grants.length}`,
    );
  }

  return {
    supersession,
    grants,
  } as const;
}
