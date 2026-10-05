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
  recordSourceAuthorityProfileParticularsWithClient,
} from "../commands/recordSourceAuthorityProfileParticularsWithClient";

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
    | "sourceAuthorityProfileParticulars"
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

  const profileParticulars =
    await recordSourceAuthorityProfileParticularsWithClient({
      client,

      instrumentReference:
        manifest.instrument.reference,

      versionNumber:
        1,

      particulars: {
        documentReference:
          manifest.sourceProfile.documentReference,

        documentVersion:
          manifest.sourceProfile.version,

        documentStatus:
          manifest.sourceProfile.status,

        registrationReference:
          manifest.sourceProfile.registrationReference,

        registrationStanding:
          manifest.sourceProfile.registrationStanding,

        registeredAddress:
          manifest.sourceProfile.registeredAddress,

        authorizedRepresentativeName:
          manifest.sourceProfile
            .authorizedRepresentativeName,

        authorizedRepresentativeCapacity:
          manifest.sourceProfile
            .authorizedRepresentativeCapacity,

        officialContact:
          manifest.sourceProfile.officialContact,
      },
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

    profileParticulars:
      profileParticulars.particulars,

    assertionIds:
      Object.fromEntries(
        assertionIds.entries(),
      ),
  };
}
