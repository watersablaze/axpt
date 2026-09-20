import { type InstrumentAuthorityClass } from "../../contracts";

import { recordRepresentativeProgramAuthorityWithClient } from "./recordRepresentativeProgramAuthorityWithClient";

import { revokeRepresentativeProgramAuthorityWithClient } from "./revokeRepresentativeProgramAuthorityWithClient";

import {
  runRepresentativeProgramGovernanceTransaction,
  type RepresentativeProgramGovernanceTransactionClient,
  type RepresentativeProgramGovernanceTransactionRunner,
} from "../governance/runRepresentativeProgramGovernanceTransaction";

import type {
  RepresentativeAuthorityConditions,
  RepresentativeAuthorityKey,
} from "../contracts";

import { assertRepresentativeAuthorityReplacementNotFuture } from "../authorityIntegrity";

export type ReplaceRepresentativeProgramAuthorityParams = Readonly<{
  appointmentId: string;
  authorityKey: RepresentativeAuthorityKey;
  authorityClass: InstrumentAuthorityClass;
  action: string;
  conditions?: RepresentativeAuthorityConditions;
  expiresAt?: Date | null;
  actorUserId: string;
  replacedAt?: Date;
}>;

/**
 * Low-level replacement operation.
 *
 * The caller owns the transaction boundary.
 *
 * One ARP authority slot changes disposition by:
 *
 *   revoke existing authority
 *   +
 *   record replacement authority
 *
 * Both operations must execute within the same transaction.
 */
export async function replaceRepresentativeProgramAuthorityWithClient(
  params: ReplaceRepresentativeProgramAuthorityParams & {
    client: RepresentativeProgramGovernanceTransactionClient;
  },
) {
  const operationStartedAt = new Date();

  const replacedAt = params.replacedAt ?? operationStartedAt;

  assertRepresentativeAuthorityReplacementNotFuture({
    replacedAt,
    now: operationStartedAt,
  });

  const revoked = await revokeRepresentativeProgramAuthorityWithClient({
    client: params.client,
    appointmentId: params.appointmentId,
    authorityKey: params.authorityKey,
    revokedByUserId: params.actorUserId,
    revokedAt: replacedAt,
  });

  if (!revoked.revoked || !revoked.authorityId) {
    throw new Error(
      `[ARP_AUTHORITY_REPLACEMENT_SOURCE_NOT_FOUND] key=${params.authorityKey}`,
    );
  }

  const recorded = await recordRepresentativeProgramAuthorityWithClient({
    client: params.client,
    appointmentId: params.appointmentId,
    authorityKey: params.authorityKey,
    authorityClass: params.authorityClass,
    action: params.action,
    conditions: params.conditions,
    effectiveAt: replacedAt,
    expiresAt: params.expiresAt ?? null,
    actorUserId: params.actorUserId,
  });

  if (!recorded.created) {
    throw new Error(
      `[ARP_AUTHORITY_REPLACEMENT_NOT_CREATED] key=${params.authorityKey}`,
    );
  }

  return {
    revokedAuthorityId: revoked.authorityId,
    replacementAuthority: recorded.authority,
    replacedAt,
  } as const;
}

/**
 * Top-level atomic replacement command.
 *
 * Use this from application / operator boundaries when no
 * transaction is already active.
 */
export async function replaceRepresentativeProgramAuthority(
  params: ReplaceRepresentativeProgramAuthorityParams & {
    client: RepresentativeProgramGovernanceTransactionRunner;
  },
) {
  const operationStartedAt = new Date();

  const replacedAt = params.replacedAt ?? operationStartedAt;

  assertRepresentativeAuthorityReplacementNotFuture({
    replacedAt,
    now: operationStartedAt,
  });

  return runRepresentativeProgramGovernanceTransaction(
    params.client,
    async (tx) =>
      replaceRepresentativeProgramAuthorityWithClient({
        client: tx,
        appointmentId: params.appointmentId,
        authorityKey: params.authorityKey,
        authorityClass: params.authorityClass,
        action: params.action,
        conditions: params.conditions,
        expiresAt: params.expiresAt,
        actorUserId: params.actorUserId,
        replacedAt,
      }),
  );
}
