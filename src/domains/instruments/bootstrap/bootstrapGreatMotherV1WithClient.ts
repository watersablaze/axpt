import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
} from "../stream";

import {
  INSTRUMENT_EVENT_TYPE,
} from "../eventTypes";

import {
  greatMotherV1Definition,
} from "../definitions/greatMotherV1Definition";

export type InstrumentBootstrapClient = Pick<
  PrismaClient,
  "institutionalInstrument" | "domainEvent"
>;

export type GreatMotherV1BootstrapResult = Readonly<{
  instrumentId: string;
  versionId: string;
  created: boolean;
  propositionCount: number;
}>;

export async function bootstrapGreatMotherV1WithClient(params: {
  client: InstrumentBootstrapClient;
  actorUserId: string;
}): Promise<GreatMotherV1BootstrapResult> {
  const {
    client,
    actorUserId,
  } = params;

  const definition = greatMotherV1Definition;

  const existing =
    await client.institutionalInstrument.findUnique({
      where: {
        reference: definition.instrument.reference,
      },
      include: {
        versions: {
          where: {
            number: definition.version.number,
          },
          include: {
            propositions: true,
          },
        },
      },
    });

  if (existing) {
    const existingVersion = existing.versions[0];

    if (!existingVersion) {
      throw new Error(
        `[GM_V1_BOOTSTRAP_VERSION_MISSING] ${existing.id}`,
      );
    }

    if (
      existingVersion.propositions.length !==
      definition.propositions.length
    ) {
      throw new Error(
        `[GM_V1_BOOTSTRAP_PROPOSITION_COUNT_MISMATCH] expected=${definition.propositions.length} actual=${existingVersion.propositions.length}`,
      );
    }

    return {
      instrumentId: existing.id,
      versionId: existingVersion.id,
      created: false,
      propositionCount: existingVersion.propositions.length,
    };
  }

  const now = new Date();

  const instrument =
    await client.institutionalInstrument.create({
      data: {
        reference: definition.instrument.reference,
        kind: definition.instrument.kind,
        title: definition.instrument.title,
        status: definition.instrument.status,
        currentVersion: definition.instrument.currentVersion,
        createdByUserId: actorUserId,

        versions: {
          create: {
            number: definition.version.number,
            status: definition.version.status,
            issuedAt: now,
            createdByUserId: actorUserId,

            propositions: {
              create: definition.propositions.map(
                (proposition) => ({
                  reference: proposition.reference,
                  domain: proposition.domain,
                  title: proposition.title,
                  body: proposition.body,
                  state: proposition.state,
                  ordinal: proposition.ordinal,
                }),
              ),
            },
          },
        },

        parties: {
          create: definition.parties.map(
            (party) => ({
              displayName: party.displayName,
              role: party.role,
            }),
          ),
        },
      },

      include: {
        versions: {
          where: {
            number: definition.version.number,
          },
          include: {
            propositions: {
              orderBy: {
                ordinal: "asc",
              },
            },
          },
        },
      },
    });

  const version = instrument.versions[0];

  if (!version) {
    throw new Error(
      `[GM_V1_BOOTSTRAP_CREATED_VERSION_MISSING] ${instrument.id}`,
    );
  }

  await client.domainEvent.createMany({
    data: [
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_CREATED,
        payload: {
          reference: instrument.reference,
          kind: instrument.kind,
          title: instrument.title,
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap",
        },
        occurredAt: now,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_CREATED,
        payload: {
          versionId: version.id,
          versionNumber: version.number,
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap",
        },
        occurredAt: now,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE.INSTRUMENT_VERSION_ISSUED,
        payload: {
          versionId: version.id,
          versionNumber: version.number,
          issuedAt: now.toISOString(),
        },
        metadata: {
          actorUserId,
          source: "instrument.bootstrap",
        },
        occurredAt: now,
      },
      ...version.propositions.map(
        (proposition: {
          id: string;
          reference: string;
          state: string;
          ordinal: number;
        }) => ({
          streamType:
            INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
          streamId: instrument.id,
          eventType:
            INSTRUMENT_EVENT_TYPE.INSTRUMENT_PROPOSITION_DEFINED,
          payload: {
            versionId: version.id,
            propositionId: proposition.id,
            reference: proposition.reference,
            state: proposition.state,
            ordinal: proposition.ordinal,
          },
          metadata: {
            actorUserId,
            source: "instrument.bootstrap",
          },
          occurredAt: now,
        }),
      ),
    ],
  });

  return {
    instrumentId: instrument.id,
    versionId: version.id,
    created: true,
    propositionCount: version.propositions.length,
  };
}
