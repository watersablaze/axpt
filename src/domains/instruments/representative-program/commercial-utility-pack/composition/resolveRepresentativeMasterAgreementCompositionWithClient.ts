import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
} from "../../../contracts";

import {
  COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  assertCommercialUtilityPackCompositionDescriptor,
  type CommercialUtilityPackCompositionDescriptor,
} from "./contracts";

import {
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
} from "../contracts";

type RepresentativeMasterAgreementProjection =
  Readonly<{
    id: string;
    reference: string;
    title: string;
    kind: string;
    status: string;
  }>;

type RepresentativeMasterAgreementIntakeProjection =
  Readonly<{
    masterAgreementInstrumentId:
      string | null;

    masterAgreementInstrument:
      RepresentativeMasterAgreementProjection | null;
  }>;

type RepresentativeMasterAgreementParticipantProjection =
  Readonly<{
    id: string;

    onboardingIntake:
      RepresentativeMasterAgreementIntakeProjection | null;
  }>;

export type RepresentativeMasterAgreementCompositionClient =
  Readonly<{
    representativeProgramParticipant: {
      findUnique(params: {
        where: {
          id: string;
        };

        select: {
          id: true;

          onboardingIntake: {
            select: {
              masterAgreementInstrumentId: true;

              masterAgreementInstrument: {
                select: {
                  id: true;
                  reference: true;
                  title: true;
                  kind: true;
                  status: true;
                };
              };
            };
          };
        };
      }): Promise<
        RepresentativeMasterAgreementParticipantProjection | null
      >;
    };
  }>;

export async function resolveRepresentativeMasterAgreementCompositionWithClient(
  params: Readonly<{
    client:
      RepresentativeMasterAgreementCompositionClient;

    participantId:
      string;
  }>,
): Promise<
  CommercialUtilityPackCompositionDescriptor | null
> {
  const participantId =
    params.participantId.trim();

  if (!participantId) {
    throw new Error(
      "[CUP_MASTER_AGREEMENT_PARTICIPANT_REQUIRED]",
    );
  }

  const participant =
    await params.client
      .representativeProgramParticipant
      .findUnique({
        where: {
          id:
            participantId,
        },

        select: {
          id:
            true,

          onboardingIntake: {
            select: {
              masterAgreementInstrumentId:
                true,

              masterAgreementInstrument: {
                select: {
                  id:
                    true,
                  reference:
                    true,
                  title:
                    true,
                  kind:
                    true,
                  status:
                    true,
                },
              },
            },
          },
        },
      });

  if (!participant) {
    throw new Error(
      `[CUP_MASTER_AGREEMENT_PARTICIPANT_NOT_FOUND] ${participantId}`,
    );
  }

  const intake =
    participant.onboardingIntake;

  if (!intake) {
    throw new Error(
      `[CUP_MASTER_AGREEMENT_INTAKE_REQUIRED] ${participantId}`,
    );
  }

  const instrumentId =
    intake.masterAgreementInstrumentId;

  const instrument =
    intake.masterAgreementInstrument;

  if (!instrumentId && !instrument) {
    return null;
  }

  if (
    !instrumentId ||
    !instrument ||
    instrument.id !== instrumentId
  ) {
    throw new Error(
      "[CUP_MASTER_AGREEMENT_BINDING_CONTRADICTION]",
    );
  }

  if (
    instrument.kind !==
      INSTITUTIONAL_INSTRUMENT_KIND
        .REPRESENTATIVE_PROGRAM_AGREEMENT
  ) {
    throw new Error(
      `[CUP_MASTER_AGREEMENT_KIND_INVALID] ${instrument.kind}`,
    );
  }

  if (
    instrument.status !==
      INSTITUTIONAL_INSTRUMENT_STATUS
        .EXECUTED
  ) {
    throw new Error(
      `[CUP_MASTER_AGREEMENT_NOT_EXECUTED] ${instrument.status}`,
    );
  }

  const descriptor:
    CommercialUtilityPackCompositionDescriptor =
    {
      module:
        COMMERCIAL_UTILITY_PACK_MODULE
          .DOCUMENTS,

      resourceType:
        COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
          .INSTITUTIONAL_INSTRUMENT,

      sourceKind:
        COMMERCIAL_UTILITY_PACK_CANONICAL_SOURCE_KIND
          .INSTITUTIONAL_INSTRUMENT,

      projectionKey:
        COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
          .REPRESENTATIVE_MASTER_AGREEMENT,

      sourceId:
        instrument.id,

      sourceReference:
        instrument.reference,

      label:
        instrument.title,
    };

  assertCommercialUtilityPackCompositionDescriptor(
    descriptor,
  );

  return descriptor;
}
