import type { PrismaClient } from "@prisma/client";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import {
  ensureFrenchWardGoverningOfficerWithClient,
} from "./ensureFrenchWardGoverningOfficerWithClient";

export type EnsureFrenchWardGoverningIdentityInput = {
  email: string;
  displayName: string;
  reference: string;
  institutionalTitle: string;
  secondaryTitle?: string | null;
  governingBasis: string;
  provenanceReference?: string | null;
  createdByUserId?: string | null;
};

function required(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `[FW_GOVERNING_IDENTITY_${field.toUpperCase()}_REQUIRED]`,
    );
  }

  return normalized;
}

function normalizeEmail(value: string) {
  const email = required(value, "email").toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("[FW_GOVERNING_IDENTITY_EMAIL_INVALID]");
  }

  return email;
}

function institutionalUsername() {
  return `french-ward-governing-${randomUUID()}`;
}

async function createUnusablePasswordHash() {
  return bcrypt.hash(
    randomBytes(48).toString("hex"),
    12,
  );
}

/**
 * Establishes the canonical AXPT User identity required for durable
 * French-Ward governing standing.
 *
 * This command deliberately does NOT:
 * - assign UserRole permissions;
 * - grant institutional access;
 * - create representative-program standing;
 * - create instrument authority;
 * - send communications.
 */
export async function ensureFrenchWardGoverningIdentityWithClient(params: {
  client: PrismaClient;
  input: EnsureFrenchWardGoverningIdentityInput;
}) {
  const email =
    normalizeEmail(params.input.email);

  const displayName =
    required(
      params.input.displayName,
      "display_name",
    );

  /*
   * Authentication canonicalizes email, while historical User rows may not.
   * Resolve case-insensitively and fail closed on contradictory identities.
   */
  const matchingUsers =
    await params.client.user.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 2,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        displayName: true,
        isAdmin: true,
        tier: true,
      },
    });

  if (matchingUsers.length > 1) {
    throw new Error(
      `[FW_GOVERNING_IDENTITY_EMAIL_CONTRADICTION] ${email}`,
    );
  }

  let user =
    matchingUsers[0];

  let userCreated =
    false;

  if (user && user.email !== email) {
    throw new Error(
      `[FW_GOVERNING_IDENTITY_EMAIL_RECONCILIATION_REQUIRED] ${email}`,
    );
  }

  if (!user) {
    const passwordHash =
      await createUnusablePasswordHash();

    user =
      await params.client.user.create({
        data: {
          username:
            institutionalUsername(),
          passwordHash,
          email,
          name:
            displayName,
          displayName,
          isAdmin:
            false,
          tier:
            "french-ward-governance",
          viewedDocs:
            [],
          metadata: {
            identityClass:
              "FRENCH_WARD_GOVERNING_OFFICER",
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          displayName: true,
          isAdmin: true,
          tier: true,
        },
      });

    userCreated =
      true;
  } else {
    const existingName =
      user.displayName ??
      user.name;

    if (
      existingName &&
      existingName !== displayName
    ) {
      throw new Error(
        "[FW_GOVERNING_IDENTITY_EXISTING_USER_NAME_CONFLICT]",
      );
    }
  }

  const officer =
    await ensureFrenchWardGoverningOfficerWithClient({
      client:
        params.client,
      input: {
        userId:
          user.id,
        reference:
          required(
            params.input.reference,
            "reference",
          ),
        displayName,
        institutionalTitle:
          required(
            params.input.institutionalTitle,
            "institutional_title",
          ),
        secondaryTitle:
          params.input.secondaryTitle ??
          null,
        governingBasis:
          required(
            params.input.governingBasis,
            "governing_basis",
          ),
        provenanceReference:
          params.input.provenanceReference ??
          null,
        createdByUserId:
          params.input.createdByUserId ??
          null,
      },
    });

  return {
    user,
    userCreated,
    officer:
      officer.record,
    officerCreated:
      officer.created,
  } as const;
}
