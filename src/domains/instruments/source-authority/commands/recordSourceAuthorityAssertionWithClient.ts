import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "../../contracts";

import { INSTRUMENT_EVENT_TYPE } from "../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../stream";

import type {
  SourceAuthorityAssertionClass,
} from "../contracts";

export type SourceAuthorityAssertionRecordingClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityAssertion"
    | "domainEvent"
  >;

function nullableTrim(
  value: string | null | undefined,
): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

export async function recordSourceAuthorityAssertionWithClient(
  params: {
    client:
      SourceAuthorityAssertionRecordingClient;
    instrumentReference: string;
    versionNumber: number;
    reference: string;
    assertionClass:
      SourceAuthorityAssertionClass;
    title: string;
    statement: string;
    scope?: string | null;
    ordinal: number;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const reference =
    params.reference.trim();

  const title =
    params.title.trim();

  const statement =
    params.statement.trim();

  if (!reference) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_REFERENCE_REQUIRED]",
    );
  }

  if (!title) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_TITLE_REQUIRED]",
    );
  }

  if (!statement) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_STATEMENT_REQUIRED]",
    );
  }

  if (
    !Number.isInteger(params.versionNumber) ||
    params.versionNumber < 1
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_VERSION_INVALID]",
    );
  }

  if (
    !Number.isInteger(params.ordinal) ||
    params.ordinal < 1
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_ORDINAL_INVALID]",
    );
  }

  const instrument =
    await params.client
      .institutionalInstrument
      .findUnique({
        where: {
          reference:
            params.instrumentReference,
        },
        include: {
          sourceAuthorityRecord: true,
        },
      });

  if (
    !instrument ||
    !instrument.sourceAuthorityRecord
  ) {
    throw new Error(
      `[SOURCE_AUTHORITY_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  if (
    instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_WRONG_INSTRUMENT_KIND]",
    );
  }

  const version =
    await params.client
      .instrumentVersion
      .findFirst({
        where: {
          instrumentId:
            instrument.id,
          number:
            params.versionNumber,
        },
      });

  if (!version) {
    throw new Error(
      `[SOURCE_AUTHORITY_ASSERTION_VERSION_NOT_FOUND] ${params.versionNumber}`,
    );
  }

  /*
   * Cross-record integrity:
   * assertion version must belong to the same
   * InstitutionalInstrument as the SAI root.
   */
  if (
    version.instrumentId !==
    instrument.id
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_ASSERTION_VERSION_INSTRUMENT_MISMATCH]",
    );
  }

  const existing =
    await params.client
      .sourceAuthorityAssertion
      .findFirst({
        where: {
          versionId:
            version.id,
          OR: [
            {
              reference,
            },
            {
              ordinal:
                params.ordinal,
            },
          ],
        },
      });

  const scope =
    nullableTrim(params.scope);

  if (existing) {
    const same =
      existing.reference ===
        reference &&
      existing.ordinal ===
        params.ordinal &&
      existing.assertionClass ===
        params.assertionClass &&
      existing.title ===
        title &&
      existing.statement ===
        statement &&
      existing.scope ===
        scope;

    if (!same) {
      throw new Error(
        "[SOURCE_AUTHORITY_ASSERTION_SLOT_CONFLICT]",
      );
    }

    return {
      assertion: existing,
      created: false,
    } as const;
  }

  const occurredAt =
    params.occurredAt ?? new Date();

  const assertion =
    await params.client
      .sourceAuthorityAssertion
      .create({
        data: {
          sourceAuthorityId:
            instrument
              .sourceAuthorityRecord.id,
          versionId:
            version.id,
          reference,
          assertionClass:
            params.assertionClass,
          title,
          statement,
          scope,
          ordinal:
            params.ordinal,
        },
      });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        instrument.id,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .SOURCE_AUTHORITY_ASSERTION_RECORDED,
      payload: {
        assertionId:
          assertion.id,
        assertionReference:
          assertion.reference,
        versionId:
          assertion.versionId,
        assertionClass:
          assertion.assertionClass,
        ordinal:
          assertion.ordinal,
      },
      metadata: {
        actorUserId:
          params.actorUserId,
        source:
          "source-authority.command.record-assertion",
      },
      occurredAt,
    },
  });

  return {
    assertion,
    created: true,
  } as const;
}
