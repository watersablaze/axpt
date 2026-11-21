import type {
  PrismaClient,
} from "@prisma/client";

import {
  EXTERNAL_INTAKE_AUTHORITY_MODE,
} from "./registerExternalIntakeWithClient";

import {
  registerExternalIntakeWithVerifiedCustody,
} from "./registerExternalIntakeWithCustody";

import {
  FRENCH_WARD_ACTION,
  resolveFrenchWardActionAuthorityWithClient,
} from "../../institutions/french-ward/governance/resolveFrenchWardActionAuthorityWithClient";

type SharedCustodyInput =
  Parameters<
    typeof registerExternalIntakeWithVerifiedCustody
  >[0];

type Principal = Readonly<{
  userId: string;
  email: string;
}>;

export const FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION =
  "REGISTER BUYER / TRANSACTION" as const;

/**
 * French-Ward institutional entrance into the existing external-intake
 * custody and persistence machinery.
 *
 * Authority is checked twice:
 *
 * 1. here, before evidence custody can write;
 * 2. inside registerExternalIntakeWithClient, inside its DB transaction.
 *
 * This function does not grant buyer, representative, negotiation,
 * signature, promotion, settlement or instrument authority.
 */
export async function registerFrenchWardBuyerTransactionWithCustody(
  input: {
    client: Pick<
      PrismaClient,
      "frenchWardGoverningOfficer"
    >;
    principal: Principal | null;
    confirmation: string;
    registration:
      SharedCustodyInput["registration"];
    store:
      SharedCustodyInput["store"];
    register:
      SharedCustodyInput["register"];
  },
) {
  const {
    client,
    principal,
    confirmation,
    registration,
    store,
    register,
  } = input;

  if (
    !principal?.userId ||
    !principal.email
  ) {
    throw new Error(
      "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED",
    );
  }

  const authority =
    await resolveFrenchWardActionAuthorityWithClient({
      client,
      userId:
        principal.userId,
      action:
        FRENCH_WARD_ACTION.REGISTER_BUYER_TRANSACTION,
    });

  if (!authority.allowed) {
    throw new Error(
      "FW_TXN_GOVERNING_REGISTRATION_AUTHORITY_REQUIRED",
    );
  }

  if (
    confirmation !==
    FRENCH_WARD_REGISTER_BUYER_TRANSACTION_CONFIRMATION
  ) {
    throw new Error(
      "FW_TXN_EXPLICIT_CONFIRMATION_REQUIRED",
    );
  }

  return registerExternalIntakeWithVerifiedCustody({
    actor: {
      userId:
        principal.userId,
      email:
        principal.email,
    },
    registration,
    store,
    register:
      registrationInput =>
        register({
          ...registrationInput,
          authorityMode:
            EXTERNAL_INTAKE_AUTHORITY_MODE
              .FRENCH_WARD_GOVERNING_REGISTER,
        }),
  });
}
