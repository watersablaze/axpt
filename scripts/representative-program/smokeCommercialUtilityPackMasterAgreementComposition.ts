import assert from "node:assert/strict";

import {
  COMMERCIAL_UTILITY_PACK_MODULE,
  COMMERCIAL_UTILITY_PACK_PROJECTION_KEY,
  COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE,
  resolveRepresentativeMasterAgreementCompositionWithClient,
  type RepresentativeMasterAgreementCompositionClient,
} from "../../src/domains/instruments/representative-program/commercial-utility-pack";

function clientFor(
  participant:
    Awaited<
      ReturnType<
        RepresentativeMasterAgreementCompositionClient[
          "representativeProgramParticipant"
        ]["findUnique"]
      >
    >,
): RepresentativeMasterAgreementCompositionClient {
  return {
    representativeProgramParticipant: {
      async findUnique() {
        return participant;
      },
    },
  };
}

async function main() {
  const validParticipant = {
    id:
      "participant-1",

    onboardingIntake: {
      masterAgreementInstrumentId:
        "instrument-ma-1",

      masterAgreementInstrument: {
        id:
          "instrument-ma-1",

        reference:
          "FWI-26-RP-ONB-CFCC47E131-MA",

        title:
          "Representative Program Master Agreement",

        kind:
          "REPRESENTATIVE_PROGRAM_AGREEMENT",

        status:
          "EXECUTED",
      },
    },
  } as const;

  const descriptor =
    await resolveRepresentativeMasterAgreementCompositionWithClient({
      client:
        clientFor(validParticipant),

      participantId:
        "participant-1",
    });

  assert.ok(descriptor);

  assert.equal(
    descriptor.module,
    COMMERCIAL_UTILITY_PACK_MODULE.DOCUMENTS,
  );

  assert.equal(
    descriptor.resourceType,
    COMMERCIAL_UTILITY_PACK_RESOURCE_TYPE
      .INSTITUTIONAL_INSTRUMENT,
  );

  assert.equal(
    descriptor.projectionKey,
    COMMERCIAL_UTILITY_PACK_PROJECTION_KEY
      .REPRESENTATIVE_MASTER_AGREEMENT,
  );

  assert.equal(
    descriptor.sourceId,
    "instrument-ma-1",
  );

  assert.equal(
    descriptor.sourceReference,
    "FWI-26-RP-ONB-CFCC47E131-MA",
  );

  console.log(
    "✓ executed bound Master Agreement resolves to canonical CUP descriptor",
  );

  const absent =
    await resolveRepresentativeMasterAgreementCompositionWithClient({
      client:
        clientFor({
          id:
            "participant-2",

          onboardingIntake: {
            masterAgreementInstrumentId:
              null,

            masterAgreementInstrument:
              null,
          },
        }),

      participantId:
        "participant-2",
    });

  assert.equal(
    absent,
    null,
  );

  console.log(
    "✓ absent Master Agreement resolves to null rather than invented content",
  );

  await assert.rejects(
    () =>
      resolveRepresentativeMasterAgreementCompositionWithClient({
        client:
          clientFor({
            id:
              "participant-3",

            onboardingIntake: {
              masterAgreementInstrumentId:
                "instrument-ma-3",

              masterAgreementInstrument: {
                id:
                  "different-id",

                reference:
                  "FWI-MA-CONTRADICTION",

                title:
                  "Master Agreement",

                kind:
                  "REPRESENTATIVE_PROGRAM_AGREEMENT",

                status:
                  "EXECUTED",
              },
            },
          }),

        participantId:
          "participant-3",
      }),

    /CUP_MASTER_AGREEMENT_BINDING_CONTRADICTION/,
  );

  console.log(
    "✓ binding contradiction rejected",
  );

  await assert.rejects(
    () =>
      resolveRepresentativeMasterAgreementCompositionWithClient({
        client:
          clientFor({
            id:
              "participant-4",

            onboardingIntake: {
              masterAgreementInstrumentId:
                "instrument-ma-4",

              masterAgreementInstrument: {
                id:
                  "instrument-ma-4",

                reference:
                  "FWI-MA-DRAFT",

                title:
                  "Master Agreement",

                kind:
                  "REPRESENTATIVE_PROGRAM_AGREEMENT",

                status:
                  "DRAFT",
              },
            },
          }),

        participantId:
          "participant-4",
      }),

    /CUP_MASTER_AGREEMENT_NOT_EXECUTED/,
  );

  console.log(
    "✓ non-executed Master Agreement rejected",
  );

  await assert.rejects(
    () =>
      resolveRepresentativeMasterAgreementCompositionWithClient({
        client:
          clientFor({
            id:
              "participant-5",

            onboardingIntake: {
              masterAgreementInstrumentId:
                "instrument-wrong-kind",

              masterAgreementInstrument: {
                id:
                  "instrument-wrong-kind",

                reference:
                  "FWI-WRONG-KIND",

                title:
                  "Other Instrument",

                kind:
                  "REPRESENTATIVE_PROGRAM_APPOINTMENT",

                status:
                  "EXECUTED",
              },
            },
          }),

        participantId:
          "participant-5",
      }),

    /CUP_MASTER_AGREEMENT_KIND_INVALID/,
  );

  console.log(
    "✓ wrong instrument kind rejected",
  );

  await assert.rejects(
    () =>
      resolveRepresentativeMasterAgreementCompositionWithClient({
        client:
          clientFor(null),

        participantId:
          "missing-participant",
      }),

    /CUP_MASTER_AGREEMENT_PARTICIPANT_NOT_FOUND/,
  );

  console.log(
    "✓ missing participant rejected",
  );

  console.log(
    "CUP_1E_MASTER_AGREEMENT_COMPOSITION_OK",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
