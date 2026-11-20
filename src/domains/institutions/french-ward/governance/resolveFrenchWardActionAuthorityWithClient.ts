import type {
  PrismaClient,
} from "@prisma/client";

import {
  loadCurrentFrenchWardGoverningStandingWithClient,
  type FrenchWardCurrentGoverningStanding,
} from "./loadCurrentFrenchWardGoverningStandingWithClient";

export const FRENCH_WARD_ACTION = {
  SEND_LOI:
    "SEND_LOI",

  REGISTER_BUYER_TRANSACTION:
    "REGISTER_BUYER_TRANSACTION",

  PROMOTE_INTAKE_TO_OPPORTUNITY:
    "PROMOTE_INTAKE_TO_OPPORTUNITY",
} as const;

export type FrenchWardAction =
  (typeof FRENCH_WARD_ACTION)[keyof typeof FRENCH_WARD_ACTION];

export const FRENCH_WARD_ACTION_AUTHORITY_REASON = {
  INVALID_ACTION:
    "INVALID_ACTION",

  NO_AUTHENTICATED_USER:
    "NO_AUTHENTICATED_USER",

  NO_GOVERNING_STANDING:
    "NO_GOVERNING_STANDING",

  GOVERNING_STANDING_INACTIVE:
    "GOVERNING_STANDING_INACTIVE",

  ACTION_RESTRICTED:
    "ACTION_RESTRICTED",
} as const;

export type FrenchWardActionAuthorityDecision =
  | Readonly<{
      allowed: true;
      action: FrenchWardAction;
      standing: FrenchWardCurrentGoverningStanding;
    }>
  | Readonly<{
      allowed: false;
      action: FrenchWardAction;
      reason:
        (typeof FRENCH_WARD_ACTION_AUTHORITY_REASON)[keyof typeof FRENCH_WARD_ACTION_AUTHORITY_REASON];
      standing: FrenchWardCurrentGoverningStanding | null;
    }>;

const FRENCH_WARD_PROMOTION_GOVERNING_REFERENCE =
  "FW-GOV-002" as const;

/**
 * Resolves French-Ward institutional action authority for an already
 * authenticated AXPT User.
 *
 * Governing standing is necessary but is not itself blanket authority.
 *
 * This resolver deliberately does NOT:
 * - authenticate the caller;
 * - inspect or grant AXPT roles / permissions;
 * - infer authority from email, name or title;
 * - infer representative or instrument authority;
 * - mutate institutional standing;
 * - mutate transaction state.
 *
 * Current institutional policy:
 * - every active French-Ward governing officer may send an LOI;
 * - every active French-Ward governing officer may register a buyer /
 *   transaction introduction;
 * - Intake -> Opportunity promotion is reserved to FW-GOV-002.
 */
export async function resolveFrenchWardActionAuthorityWithClient(
  params: {
    client: Pick<
      PrismaClient,
      "frenchWardGoverningOfficer"
    >;
    userId: string;
    action: FrenchWardAction;
  },
): Promise<FrenchWardActionAuthorityDecision> {
  const action =
    params.action;

  if (
    !Object.values(FRENCH_WARD_ACTION).includes(
      action as FrenchWardAction,
    )
  ) {
    return {
      allowed: false,
      action,
      reason:
        FRENCH_WARD_ACTION_AUTHORITY_REASON.INVALID_ACTION,
      standing: null,
    } as FrenchWardActionAuthorityDecision;
  }

  const userId =
    params.userId.trim();

  if (!userId) {
    return {
      allowed: false,
      action: params.action,
      reason:
        FRENCH_WARD_ACTION_AUTHORITY_REASON.NO_AUTHENTICATED_USER,
      standing: null,
    };
  }

  const standing =
    await loadCurrentFrenchWardGoverningStandingWithClient({
      client:
        params.client,
      userId,
    });

  if (!standing) {
    return {
      allowed: false,
      action: params.action,
      reason:
        FRENCH_WARD_ACTION_AUTHORITY_REASON.NO_GOVERNING_STANDING,
      standing: null,
    };
  }

  if (!standing.active) {
    return {
      allowed: false,
      action: params.action,
      reason:
        FRENCH_WARD_ACTION_AUTHORITY_REASON.GOVERNING_STANDING_INACTIVE,
      standing,
    };
  }

  if (
    params.action ===
      FRENCH_WARD_ACTION.PROMOTE_INTAKE_TO_OPPORTUNITY &&
    standing.reference !==
      FRENCH_WARD_PROMOTION_GOVERNING_REFERENCE
  ) {
    return {
      allowed: false,
      action: params.action,
      reason:
        FRENCH_WARD_ACTION_AUTHORITY_REASON.ACTION_RESTRICTED,
      standing,
    };
  }

  return {
    allowed: true,
    action: params.action,
    standing,
  };
}
