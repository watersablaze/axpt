import type {
  FrenchWardInstitutionalCapacityClass,
  PrismaClient,
} from "@prisma/client";

export type FrenchWardCurrentInstitutionalParticipant =
  Readonly<{
    reference: string;
    userId: string;
    displayName: string;
    institutionalTitle: string;
    secondaryTitle: string | null;
    capacityClass:
      FrenchWardInstitutionalCapacityClass;
    recognitionBasis: string;
    provenanceReference: string | null;
    status: string;
    recognizedAt: Date;
    active: boolean;
  }>;

/**
 * Projects current French-Ward institutional participation for an
 * already-authenticated canonical AXPT User.
 *
 * Participation establishes internal institutional recognition only.
 *
 * It does NOT:
 * - authenticate the user;
 * - grant AXPT roles or permissions;
 * - grant French-Ward governing standing;
 * - grant commercial action authority;
 * - grant instrument authority;
 * - grant institutional resource access;
 * - infer authority from title or capacity class;
 * - mutate institutional recognition.
 */
export async function
loadCurrentFrenchWardInstitutionalParticipantWithClient(
  params: {
    client: Pick<
      PrismaClient,
      "frenchWardInstitutionalParticipant"
    >;
    userId: string;
  },
): Promise<
  FrenchWardCurrentInstitutionalParticipant | null
> {
  const userId =
    params.userId.trim();

  if (!userId) {
    return null;
  }

  const record =
    await params.client
      .frenchWardInstitutionalParticipant
      .findUnique({
        where: {
          userId,
        },
        select: {
          reference: true,
          userId: true,
          displayName: true,
          institutionalTitle: true,
          secondaryTitle: true,
          capacityClass: true,
          recognitionBasis: true,
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
    capacityClass:
      record.capacityClass,
    recognitionBasis:
      record.recognitionBasis,
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
