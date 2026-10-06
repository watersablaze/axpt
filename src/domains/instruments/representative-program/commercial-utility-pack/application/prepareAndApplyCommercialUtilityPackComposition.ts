import {
  applyCommercialUtilityPackComposition,
} from "./applyCommercialUtilityPackComposition";

import {
  prepareCommercialUtilityPack,
} from "./prepareCommercialUtilityPack";

import type {
  CommercialUtilityPackGovernanceTransactionRunner,
} from "../governance/runCommercialUtilityPackGovernanceTransaction";

/**
 * Prepare the canonical representative CUP and then apply its current
 * representative-safe composition.
 *
 * IMPORTANT:
 *
 * This function coordinates TWO deliberate transaction boundaries.
 *
 * Transaction A:
 *   prepareCommercialUtilityPack()
 *
 * Transaction B:
 *   applyCommercialUtilityPackComposition()
 *
 * Package preparation is committed before composition begins.
 *
 * Therefore, if composition fails:
 * - the canonical CUP remains committed;
 * - the composition transaction rolls back independently;
 * - no compensating package deletion is attempted;
 * - the original composition failure propagates.
 *
 * Exact replay remains semantic:
 * - preparation may return created=false;
 * - composition independently replays idempotently.
 *
 * This bridge does not:
 * - merge the two transactions;
 * - release CUP resources;
 * - release CUP modules;
 * - reconcile package release state;
 * - manufacture unavailable source content.
 */
export async function prepareAndApplyCommercialUtilityPackComposition(
  params: Readonly<{
    client:
      CommercialUtilityPackGovernanceTransactionRunner;

    participantId:
      string;

    version?:
      number;

    actorUserId:
      string;

    sourceAuthorityInstrumentReference?:
      string | null;

    occurredAt?:
      Date;
  }>,
) {
  const preparation =
    await prepareCommercialUtilityPack({
      client:
        params.client,

      participantId:
        params.participantId,

      version:
        params.version,

      actorUserId:
        params.actorUserId,

      occurredAt:
        params.occurredAt,
    });

  /*
   * Deliberately begins only after preparation has committed.
   *
   * Do not wrap these two calls in a parent transaction.
   */
  const composition =
    await applyCommercialUtilityPackComposition({
      client:
        params.client,

      packageId:
        preparation.package.id,

      participantId:
        params.participantId,

      actorUserId:
        params.actorUserId,

      sourceAuthorityInstrumentReference:
        params.sourceAuthorityInstrumentReference,

      occurredAt:
        params.occurredAt,
    });

  return {
    package:
      preparation.package,

    reference:
      preparation.reference,

    packageCreated:
      preparation.created,

    preparation,

    composition,
  } as const;
}
