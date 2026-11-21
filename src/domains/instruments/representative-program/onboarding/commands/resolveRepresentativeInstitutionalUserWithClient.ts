import {
  createHash,
  randomBytes,
} from "node:crypto";

import bcrypt from "bcryptjs";

import type {
  PrismaClient,
} from "@prisma/client";

import {
  REPRESENTATIVE_ONBOARDING_STATUS,
} from "../contracts";

export type RepresentativeInstitutionalUserProvisioningClient =
  Pick<
    PrismaClient,
    | "user"
    | "representativeOnboardingIntake"
  >;

const PASSWORD_HASH_ROUNDS = 12;

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function institutionalUsername(
  email: string,
) {
  const digest =
    createHash("sha256")
      .update(email)
      .digest("hex")
      .slice(0, 32);

  return `arp-${digest}`;
}

async function createUnusablePasswordHash() {
  /*
   * User.passwordHash remains required by the legacy User schema.
   *
   * Representative authentication does NOT use a password.
   * We therefore hash a high-entropy random value and immediately
   * discard that value. No usable representative password exists.
   */
  const secret =
    randomBytes(32)
      .toString("base64url");

  return bcrypt.hash(
    secret,
    PASSWORD_HASH_ROUNDS,
  );
}

/**
 * REP-1B.2
 *
 * Resolve or provision the canonical AXPT User identity associated
 * with a Representative Program intake.
 *
 * USER CREATED ≠ ADMITTED ≠ APPOINTED ≠ AUTHORIZED
 *
 * Provisioning alone grants no Program access. Representative
 * authentication eligibility arises only after the User is linked
 * to an admitted Representative Program Participant.
 */
export async function resolveRepresentativeInstitutionalUserWithClient(
  params: {
    client:
      RepresentativeInstitutionalUserProvisioningClient;
    intakeId: string;
  },
) {
  const intakeId =
    params.intakeId.trim();

  if (!intakeId) {
    throw new Error(
      "[ARP_REPRESENTATIVE_USER_INTAKE_REQUIRED]",
    );
  }

  const intake =
    await params.client.representativeOnboardingIntake.findUnique({
      where: {
        id: intakeId,
      },
      select: {
        id: true,
        status: true,
        candidateEmail: true,
        candidateDisplayName: true,
      },
    });

  if (!intake) {
    throw new Error(
      `[ARP_REPRESENTATIVE_USER_INTAKE_NOT_FOUND] ${intakeId}`,
    );
  }

  if (
    intake.status !==
      REPRESENTATIVE_ONBOARDING_STATUS.QUALIFIED &&
    intake.status !==
      REPRESENTATIVE_ONBOARDING_STATUS.ADMITTED
  ) {
    throw new Error(
      `[ARP_REPRESENTATIVE_USER_ADMISSION_BOUNDARY_REQUIRED] ${intake.status}`,
    );
  }

  const email =
    normalizeEmail(
      intake.candidateEmail,
    );

  if (!email) {
    throw new Error(
      "[ARP_REPRESENTATIVE_USER_EMAIL_REQUIRED]",
    );
  }

  /*
   * User.email is currently case-sensitive at the database unique
   * constraint level, while authentication canonicalizes email.
   * Resolve case-insensitively and fail closed if historical data
   * contains more than one case-variant identity.
   */
  const matchingUsers =
    await params.client.user.findMany({
      where: {
        email: {
          equals:
            email,
          mode:
            "insensitive",
        },
      },
      orderBy: {
        createdAt:
          "asc",
      },
      take:
        2,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        tier: true,
      },
    });

  if (
    matchingUsers.length > 1
  ) {
    throw new Error(
      `[ARP_REPRESENTATIVE_USER_EMAIL_IDENTITY_CONTRADICTION] ${email}`,
    );
  }

  const existing =
    matchingUsers[0];

  if (existing) {
    return {
      user:
        existing,
      created:
        false,
    } as const;
  }

  const passwordHash =
    await createUnusablePasswordHash();

  const created =
    await params.client.user.create({
      data: {
        username:
          institutionalUsername(
            email,
          ),
        passwordHash,
        email,
        isAdmin:
          false,
        name:
          intake.candidateDisplayName,
        displayName:
          intake.candidateDisplayName,
        tier:
          "representative",
        viewedDocs:
          [],
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        isAdmin: true,
        tier: true,
      },
    });

  return {
    user:
      created,
    created:
      true,
  } as const;
}
