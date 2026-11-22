import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_VERSION_STATUS,
} from "../../contracts";

import { INSTRUMENT_EVENT_TYPE } from "../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../stream";

import type {
  SourceAuthoritySubject,
} from "../contracts";

import {
  assertSourceAuthoritySubject,
} from "../invariants";

export type SourceAuthorityEstablishmentClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "domainEvent"
  >;

function normalizedNullable(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function normalizedCommodities(
  values: readonly string[],
): string[] {
  return values.map(
    (value) => value.trim(),
  );
}

export async function establishSourceAuthorityWithClient(
  params: {
    client: SourceAuthorityEstablishmentClient;
    reference: string;
    title: string;
    subject: SourceAuthoritySubject;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const reference = params.reference.trim();
  const title = params.title.trim();

  if (!reference) {
    throw new Error(
      "[SOURCE_AUTHORITY_REFERENCE_REQUIRED]",
    );
  }

  if (!title) {
    throw new Error(
      "[SOURCE_AUTHORITY_TITLE_REQUIRED]",
    );
  }

  assertSourceAuthoritySubject(params.subject);

  const subject = {
    displayName:
      params.subject.displayName.trim(),

    jurisdiction:
      params.subject.jurisdiction.trim(),

    institutionalCapacity:
      params.subject.institutionalCapacity.trim(),

    operatingBase:
      normalizedNullable(
        params.subject.operatingBase,
      ),

    sector:
      normalizedNullable(
        params.subject.sector,
      ),

    principalCommodityActivity:
      normalizedCommodities(
        params.subject
          .principalCommodityActivity,
      ),
  };

  const existing =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference,
        },
        include: {
          versions: {
            where: {
              number: 1,
            },
          },
          sourceAuthorityRecord: true,
        },
      });

  if (existing) {
    if (
      existing.kind !==
      INSTITUTIONAL_INSTRUMENT_KIND
        .SOURCE_AUTHORITY
    ) {
      throw new Error(
        `[SOURCE_AUTHORITY_REFERENCE_OCCUPIED] ${reference}`,
      );
    }

    const version = existing.versions[0];
    const record =
      existing.sourceAuthorityRecord;

    if (!version || !record) {
      throw new Error(
        "[SOURCE_AUTHORITY_EXISTING_ROOT_INCOMPLETE]",
      );
    }

    const same =
      existing.title === title &&
      existing.currentVersion === 1 &&
      record.subjectDisplayName ===
        subject.displayName &&
      record.jurisdiction ===
        subject.jurisdiction &&
      record.institutionalCapacity ===
        subject.institutionalCapacity &&
      record.operatingBase ===
        subject.operatingBase &&
      record.sector === subject.sector &&
      JSON.stringify(
        record.principalCommodityActivity,
      ) ===
        JSON.stringify(
          subject.principalCommodityActivity,
        );

    if (!same) {
      throw new Error(
        "[SOURCE_AUTHORITY_EXISTING_ROOT_CONFLICT]",
      );
    }

    return {
      instrument: existing,
      version,
      record,
      created: false,
    } as const;
  }

  const occurredAt =
    params.occurredAt ?? new Date();

  const instrument =
    await params.client
      .institutionalInstrument
      .create({
        data: {
          reference,
          kind:
            INSTITUTIONAL_INSTRUMENT_KIND
              .SOURCE_AUTHORITY,
          title,
          status:
            INSTITUTIONAL_INSTRUMENT_STATUS
              .DRAFT,
          currentVersion: 1,
          createdByUserId:
            params.actorUserId,
        },
      });

  const version =
    await params.client.instrumentVersion.create({
      data: {
        instrumentId: instrument.id,
        number: 1,
        status:
          INSTRUMENT_VERSION_STATUS.DRAFT,
        createdByUserId:
          params.actorUserId,
      },
    });

  const record =
    await params.client
      .sourceAuthorityRecord
      .create({
        data: {
          instrumentId: instrument.id,
          subjectDisplayName:
            subject.displayName,
          jurisdiction:
            subject.jurisdiction,
          institutionalCapacity:
            subject.institutionalCapacity,
          operatingBase:
            subject.operatingBase,
          sector:
            subject.sector,
          principalCommodityActivity:
            subject
              .principalCommodityActivity,
        },
      });

  await params.client.domainEvent.createMany({
    data: [
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_CREATED,
        payload: {
          reference:
            instrument.reference,
          kind:
            instrument.kind,
          title:
            instrument.title,
        },
        metadata: {
          actorUserId:
            params.actorUserId,
          source:
            "source-authority.command.establish",
        },
        occurredAt,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .INSTRUMENT_VERSION_CREATED,
        payload: {
          versionId:
            version.id,
          versionNumber:
            version.number,
        },
        metadata: {
          actorUserId:
            params.actorUserId,
          source:
            "source-authority.command.establish",
        },
        occurredAt,
      },
      {
        streamType:
          INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
        streamId: instrument.id,
        eventType:
          INSTRUMENT_EVENT_TYPE
            .SOURCE_AUTHORITY_ESTABLISHED,
        payload: {
          sourceAuthorityId:
            record.id,
          subjectDisplayName:
            record.subjectDisplayName,
          jurisdiction:
            record.jurisdiction,
          institutionalCapacity:
            record.institutionalCapacity,
        },
        metadata: {
          actorUserId:
            params.actorUserId,
          source:
            "source-authority.command.establish",
        },
        occurredAt,
      },
    ],
  });

  return {
    instrument,
    version,
    record,
    created: true,
  } as const;
}
