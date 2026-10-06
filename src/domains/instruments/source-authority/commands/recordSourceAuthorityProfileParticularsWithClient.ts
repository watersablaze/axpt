import type {
  PrismaClient,
} from "@prisma/client";

import type {
  SourceAuthorityProfileParticulars,
} from "../contracts";

export type SourceAuthorityProfileParticularsClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityProfileParticulars"
  >;

function required(
  value: string,
  code: string,
): string {
  const trimmed =
    value.trim();

  if (!trimmed) {
    throw new Error(code);
  }

  return trimmed;
}

function nullable(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

export async function recordSourceAuthorityProfileParticularsWithClient(
  params: Readonly<{
    client:
      SourceAuthorityProfileParticularsClient;

    instrumentReference:
      string;

    versionNumber:
      number;

    particulars:
      SourceAuthorityProfileParticulars;
  }>,
) {
  const instrumentReference =
    required(
      params.instrumentReference,
      "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_INSTRUMENT_REFERENCE_REQUIRED]",
    );

  if (
    !Number.isInteger(params.versionNumber) ||
    params.versionNumber < 1
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_VERSION_INVALID]",
    );
  }

  const particulars = {
    documentReference:
      required(
        params.particulars.documentReference,
        "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_DOCUMENT_REFERENCE_REQUIRED]",
      ),

    documentVersion:
      required(
        params.particulars.documentVersion,
        "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_DOCUMENT_VERSION_REQUIRED]",
      ),

    documentStatus:
      required(
        params.particulars.documentStatus,
        "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_DOCUMENT_STATUS_REQUIRED]",
      ),

    registrationReference:
      nullable(
        params.particulars.registrationReference,
      ),

    registrationStanding:
      required(
        params.particulars.registrationStanding,
        "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_REGISTRATION_STANDING_REQUIRED]",
      ),

    registeredAddress:
      nullable(
        params.particulars.registeredAddress,
      ),

    authorizedRepresentativeName:
      nullable(
        params.particulars
          .authorizedRepresentativeName,
      ),

    authorizedRepresentativeCapacity:
      nullable(
        params.particulars
          .authorizedRepresentativeCapacity,
      ),

    officialContact:
      nullable(
        params.particulars.officialContact,
      ),
  };

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            instrumentReference,
        },

        select: {
          id:
            true,
        },
      });

  if (!instrument) {
    throw new Error(
      "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_INSTRUMENT_NOT_FOUND]",
    );
  }

  const version =
    await params.client
      .instrumentVersion
      .findUnique({
        where: {
          instrumentId_number: {
            instrumentId:
              instrument.id,

            number:
              params.versionNumber,
          },
        },

        select: {
          id:
            true,
        },
      });

  if (!version) {
    throw new Error(
      "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_VERSION_NOT_FOUND]",
    );
  }

  const sourceAuthority =
    await params.client
      .sourceAuthorityRecord
      .findUnique({
        where: {
          instrumentId:
            instrument.id,
        },

        select: {
          id:
            true,
        },
      });

  if (!sourceAuthority) {
    throw new Error(
      "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_ROOT_NOT_FOUND]",
    );
  }

  const existing =
    await params.client
      .sourceAuthorityProfileParticulars
      .findUnique({
        where: {
          sourceAuthorityId_versionId: {
            sourceAuthorityId:
              sourceAuthority.id,

            versionId:
              version.id,
          },
        },
      });

  if (existing) {
    const same =
      existing.documentReference ===
        particulars.documentReference &&
      existing.documentVersion ===
        particulars.documentVersion &&
      existing.documentStatus ===
        particulars.documentStatus &&
      existing.registrationReference ===
        particulars.registrationReference &&
      existing.registrationStanding ===
        particulars.registrationStanding &&
      existing.registeredAddress ===
        particulars.registeredAddress &&
      existing.authorizedRepresentativeName ===
        particulars.authorizedRepresentativeName &&
      existing.authorizedRepresentativeCapacity ===
        particulars.authorizedRepresentativeCapacity &&
      existing.officialContact ===
        particulars.officialContact;

    if (!same) {
      throw new Error(
        "[SOURCE_AUTHORITY_PROFILE_PARTICULARS_CONFLICT]",
      );
    }

    return {
      particulars:
        existing,

      created:
        false,
    } as const;
  }

  const created =
    await params.client
      .sourceAuthorityProfileParticulars
      .create({
        data: {
          sourceAuthorityId:
            sourceAuthority.id,

          versionId:
            version.id,

          ...particulars,
        },
      });

  return {
    particulars:
      created,

    created:
      true,
  } as const;
}
