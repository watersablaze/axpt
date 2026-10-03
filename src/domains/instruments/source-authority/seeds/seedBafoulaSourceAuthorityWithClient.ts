import type {
  PrismaClient,
} from "@prisma/client";

import {
  establishSourceAuthorityWithClient,
} from "../commands/establishSourceAuthorityWithClient";

import {
  recordSourceAuthorityAssertionWithClient,
} from "../commands/recordSourceAuthorityAssertionWithClient";

import {
  recordSourceAuthorityCapabilityWithClient,
} from "../commands/recordSourceAuthorityCapabilityWithClient";

import {
  BAFOULA_SOURCE_AUTHORITY_MANIFEST,
} from "./bafoulaCanonicalManifest";

export type BafoulaSourceAuthoritySeedClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentVersion"
    | "sourceAuthorityRecord"
    | "sourceAuthorityAssertion"
    | "sourceAuthorityCapability"
    | "sourceAuthorityRecognition"
    | "sourceAuthorityRecognitionEvidence"
    | "instrumentEvidence"
    | "domainEvent"
  >;

export async function seedBafoulaSourceAuthorityWithClient(
  input: Readonly<{
    client:
      BafoulaSourceAuthoritySeedClient;

    actorUserId:
      string;
  }>,
) {
  const {
    client,
    actorUserId,
  } = input;

  const manifest =
    BAFOULA_SOURCE_AUTHORITY_MANIFEST;

  const established =
    await establishSourceAuthorityWithClient({
      client,

      reference:
        manifest.instrument.reference,

      title:
        manifest.instrument.title,

      subject:
        manifest.subject,

      actorUserId,
    });

  const assertionIds =
    new Map<string, string>();

  for (
    const assertion
    of manifest.assertions
  ) {
    const result =
      await recordSourceAuthorityAssertionWithClient({
        client,

        instrumentReference:
          manifest.instrument.reference,

        versionNumber:
          1,

        reference:
          assertion.reference,

        assertionClass:
          assertion.assertionClass,

        title:
          assertion.title,

        statement:
          assertion.statement,

        scope:
          assertion.scope,

        ordinal:
          assertion.ordinal,

        actorUserId,
      });

    assertionIds.set(
      assertion.reference,
      result.assertion.id,
    );
  }

  for (
    const capability
    of manifest.capabilities
  ) {
    const assertionId =
      assertionIds.get(
        capability.assertionReference,
      );

    if (!assertionId) {
      throw new Error(
        `[BAFOULA_SOURCE_AUTHORITY_CAPABILITY_ASSERTION_MISSING:${capability.assertionReference}]`,
      );
    }

    await recordSourceAuthorityCapabilityWithClient({
      client,

      assertionId,

      capabilityKey:
        capability.capabilityKey,

      title:
        capability.title,

      description:
        capability.description,

      actorUserId,
    });
  }

  return {
    instrument:
      established.instrument,

    sourceAuthority:
      established.record,

    assertionIds:
      Object.fromEntries(
        assertionIds.entries(),
      ),
  };
}
