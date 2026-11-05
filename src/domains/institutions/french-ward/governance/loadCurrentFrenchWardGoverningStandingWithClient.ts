import type {
  PrismaClient,
} from "@prisma/client";

export type FrenchWardCurrentGoverningStanding = Readonly<{
  reference: string;
  userId: string;
  displayName: string;
  institutionalTitle: string;
  secondaryTitle: string | null;
  governingBasis: string;
  provenanceReference: string | null;
  status: string;
  recognizedAt: Date;
  active: boolean;
}>;

/**
 * Projects French-Ward governing standing for an already-authenticated AXPT User.
 *
 * This is institutional identity / standing only.
 *
 * It does NOT:
 * - authenticate the user;
 * - grant AXPT roles or permissions;
 * - grant commercial authority;
 * - grant instrument authority;
 * - grant institutional resource access;
 * - infer authority from title;
 * - mutate governing standing.
 */
export async function loadCurrentFrenchWardGoverningStandingWithClient(
  params: {
    client: Pick<
      PrismaClient,
      "frenchWardGoverningOfficer"
    >;
    userId: string;
  },
): Promise<FrenchWardCurrentGoverningStanding | null> {
  const userId =
    params.userId.trim();

  if (!userId) {
    return null;
  }

  const record =
    await params.client.frenchWardGoverningOfficer.findUnique({
      where: {
        userId,
      },
      select: {
        reference: true,
        userId: true,
        displayName: true,
        institutionalTitle: true,
        secondaryTitle: true,
        governingBasis: true,
        provenanceReference: true,
        status: true,
        recognizedAt: true,
        endedAt: true,
      },
    });

  if (!record) {
    return null;
  }

  return {
    reference:
      record.reference,
    userId:
      record.userId,
    displayName:
      record.displayName,
    institutionalTitle:
      record.institutionalTitle,
    secondaryTitle:
      record.secondaryTitle,
    governingBasis:
      record.governingBasis,
    provenanceReference:
      record.provenanceReference,
    status:
      record.status,
    recognizedAt:
      record.recognizedAt,
    active:
      record.status === "ACTIVE" &&
      record.endedAt === null,
  };
}
