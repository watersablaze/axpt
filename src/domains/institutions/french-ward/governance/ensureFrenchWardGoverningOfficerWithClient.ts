import type { PrismaClient } from "@prisma/client";

export const FRENCH_WARD_GOVERNING_OFFICER_STATUS = {
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
} as const;

export type EnsureFrenchWardGoverningOfficerInput = {
  userId: string;
  reference: string;
  displayName: string;
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
      `[FW_GOVERNING_OFFICER_${field.toUpperCase()}_REQUIRED]`,
    );
  }

  return normalized;
}

/**
 * Records French-Ward governing standing for an already-existing AXPT User.
 *
 * This command does NOT:
 * - create the User;
 * - assign UserRole permissions;
 * - create representative-program standing;
 * - create instrument authority;
 * - create institutional-access grants.
 */
export async function ensureFrenchWardGoverningOfficerWithClient(params: {
  client: PrismaClient;
  input: EnsureFrenchWardGoverningOfficerInput;
}) {
  const input = params.input;

  const userId = required(input.userId, "user_id");
  const reference = required(input.reference, "reference");
  const displayName = required(input.displayName, "display_name");
  const institutionalTitle = required(
    input.institutionalTitle,
    "institutional_title",
  );
  const governingBasis = required(
    input.governingBasis,
    "governing_basis",
  );

  const user = await params.client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  if (!user) {
    throw new Error(
      `[FW_GOVERNING_OFFICER_USER_NOT_FOUND] ${userId}`,
    );
  }

  const byReference =
    await params.client.frenchWardGoverningOfficer.findUnique({
      where: { reference },
    });

  const byUser =
    await params.client.frenchWardGoverningOfficer.findUnique({
      where: { userId },
    });

  const existing = byReference ?? byUser;

  if (byReference && byUser && byReference.id !== byUser.id) {
    throw new Error(
      "[FW_GOVERNING_OFFICER_IDENTITY_CONTRADICTION]",
    );
  }

  const expected = {
    userId,
    reference,
    displayName,
    institutionalTitle,
    secondaryTitle:
      input.secondaryTitle?.trim() || null,
    governingBasis,
    provenanceReference:
      input.provenanceReference?.trim() || null,
  };

  if (existing) {
    const consistent =
      existing.userId === expected.userId &&
      existing.reference === expected.reference &&
      existing.displayName === expected.displayName &&
      existing.institutionalTitle === expected.institutionalTitle &&
      existing.secondaryTitle === expected.secondaryTitle &&
      existing.governingBasis === expected.governingBasis &&
      existing.provenanceReference === expected.provenanceReference;

    if (!consistent) {
      throw new Error(
        "[FW_GOVERNING_OFFICER_EXISTING_RECORD_CONFLICT]",
      );
    }

    return {
      record: existing,
      created: false,
    } as const;
  }

  const record =
    await params.client.frenchWardGoverningOfficer.create({
      data: {
        ...expected,
        status: FRENCH_WARD_GOVERNING_OFFICER_STATUS.ACTIVE,
        createdByUserId: input.createdByUserId ?? null,
      },
    });

  return {
    record,
    created: true,
  } as const;
}
