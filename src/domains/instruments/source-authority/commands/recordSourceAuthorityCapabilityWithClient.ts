import type { PrismaClient } from "@prisma/client";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
} from "../../contracts";

import { INSTRUMENT_EVENT_TYPE } from "../../eventTypes";
import { INSTITUTIONAL_INSTRUMENT_STREAM_TYPE } from "../../stream";

import type {
  SourceAuthorityCapabilityKey,
} from "../contracts";

import {
  isSourceAuthorityCapabilityKey,
} from "../invariants";

export type SourceAuthorityCapabilityRecordingClient =
  Pick<
    PrismaClient,
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "domainEvent"
  >;

export async function recordSourceAuthorityCapabilityWithClient(
  params: {
    client:
      SourceAuthorityCapabilityRecordingClient;
    assertionId: string;
    capabilityKey:
      SourceAuthorityCapabilityKey;
    title: string;
    description: string;
    actorUserId: string;
    occurredAt?: Date;
  },
) {
  const title =
    params.title.trim();

  const description =
    params.description.trim();

  if (
    !isSourceAuthorityCapabilityKey(
      params.capabilityKey,
    )
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_INVALID]",
    );
  }

  if (!title) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_TITLE_REQUIRED]",
    );
  }

  if (!description) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_DESCRIPTION_REQUIRED]",
    );
  }

  const assertion =
    await params.client
      .sourceAuthorityAssertion
      .findUnique({
        where: {
          id:
            params.assertionId,
        },
        include: {
          sourceAuthority: {
            include: {
              instrument: true,
            },
          },
        },
      });

  if (!assertion) {
    throw new Error(
      `[SOURCE_AUTHORITY_CAPABILITY_ASSERTION_NOT_FOUND] ${params.assertionId}`,
    );
  }

  if (
    assertion.sourceAuthority
      .instrument.kind !==
    INSTITUTIONAL_INSTRUMENT_KIND
      .SOURCE_AUTHORITY
  ) {
    throw new Error(
      "[SOURCE_AUTHORITY_CAPABILITY_WRONG_INSTRUMENT_KIND]",
    );
  }

  const existing =
    await params.client
      .sourceAuthorityCapability
      .findFirst({
        where: {
          assertionId:
            assertion.id,
          capabilityKey:
            params.capabilityKey,
        },
      });

  if (existing) {
    if (
      existing.title !== title ||
      existing.description !== description
    ) {
      throw new Error(
        "[SOURCE_AUTHORITY_CAPABILITY_SLOT_CONFLICT]",
      );
    }

    return {
      capability: existing,
      created: false,
    } as const;
  }

  const occurredAt =
    params.occurredAt ?? new Date();

  const capability =
    await params.client
      .sourceAuthorityCapability
      .create({
        data: {
          assertionId:
            assertion.id,
          capabilityKey:
            params.capabilityKey,
          title,
          description,
        },
      });

  await params.client.domainEvent.create({
    data: {
      streamType:
        INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
      streamId:
        assertion.sourceAuthority
          .instrumentId,
      eventType:
        INSTRUMENT_EVENT_TYPE
          .SOURCE_AUTHORITY_CAPABILITY_RECORDED,
      payload: {
        capabilityId:
          capability.id,
        assertionId:
          assertion.id,
        capabilityKey:
          capability.capabilityKey,
      },
      metadata: {
        actorUserId:
          params.actorUserId,
        source:
          "source-authority.command.record-capability",
      },
      occurredAt,
    },
  });

  return {
    capability,
    created: true,
  } as const;
}
