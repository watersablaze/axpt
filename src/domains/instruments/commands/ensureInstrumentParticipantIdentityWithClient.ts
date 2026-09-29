import {
  createHash,
  randomBytes,
} from "node:crypto";

import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

import {
  INSTRUMENT_PARTY_ROLE,
  type InstrumentPartyRole,
} from "../contracts";
import {
  INSTRUMENT_EVENT_TYPE,
} from "../eventTypes";
import {
  INSTITUTIONAL_INSTRUMENT_STREAM_TYPE,
} from "../stream";

export type InstrumentParticipantIdentityClient =
  Pick<
    PrismaClient,
    | "institutionalInstrument"
    | "instrumentParty"
    | "user"
    | "domainEvent"
  >;

function normalizeEmail(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function externalUsername(
  email: string,
) {
  const suffix =
    createHash("sha256")
      .update(
        email,
        "utf8",
      )
      .digest("hex")
      .slice(0, 24);

  return `institutional-${suffix}`;
}

async function createDisabledPasswordHash() {
  /*
   * External instrument identities do not authenticate
   * with this credential.
   *
   * A random unknown secret is hashed so the legacy
   * required passwordHash column remains structurally
   * valid without establishing a usable password.
   */
  const secret =
    randomBytes(48)
      .toString("base64url");

  return bcrypt.hash(
    secret,
    12,
  );
}

export async function ensureInstrumentParticipantIdentityWithClient(
  params: {
    client:
      InstrumentParticipantIdentityClient;

    instrumentReference:
      string;

    email:
      string;

    displayName:
      string;

    partyRole?:
      InstrumentPartyRole;

    createdByUserId:
      string;

    occurredAt?:
      Date;
  },
) {
  const email =
    normalizeEmail(
      params.email,
    );

  const displayName =
    params.displayName.trim();

  if (
    email.length < 3 ||
    email.length > 254 ||
    !email.includes("@")
  ) {
    throw new Error(
      "[INSTRUMENT_PARTICIPANT_EMAIL_INVALID]",
    );
  }

  if (!displayName) {
    throw new Error(
      "[INSTRUMENT_PARTICIPANT_DISPLAY_NAME_REQUIRED]",
    );
  }

  const partyRole =
    params.partyRole ??
    INSTRUMENT_PARTY_ROLE
      .DELIBERATOR;

  const instrument =
    await params.client.institutionalInstrument.findUnique({
      where: {
        reference:
          params.instrumentReference,
      },
      select: {
        id: true,
        reference: true,
      },
    });

  if (!instrument) {
    throw new Error(
      `[INSTRUMENT_PARTICIPANT_INSTRUMENT_NOT_FOUND] ${params.instrumentReference}`,
    );
  }

  const creator =
    await params.client.user.findUnique({
      where: {
        id:
          params.createdByUserId,
      },
      select: {
        id: true,
      },
    });

  if (!creator) {
    throw new Error(
      `[INSTRUMENT_PARTICIPANT_CREATOR_NOT_FOUND] ${params.createdByUserId}`,
    );
  }

  let user =
    await params.client.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        name: true,
        isAdmin: true,
      },
    });

  let identityCreated =
    false;

  if (!user) {
    const username =
      externalUsername(
        email,
      );

    const usernameOwner =
      await params.client.user.findUnique({
        where: {
          username,
        },
        select: {
          id: true,
          email: true,
        },
      });

    if (
      usernameOwner &&
      usernameOwner.email !==
        email
    ) {
      throw new Error(
        "[INSTRUMENT_PARTICIPANT_USERNAME_COLLISION]",
      );
    }

    const passwordHash =
      await createDisabledPasswordHash();

    user =
      await params.client.user.create({
        data: {
          username,
          passwordHash,
          email,
          isAdmin:
            false,
          displayName,
          viewedDocs:
            [],
          metadata: {
            identityClass:
              "INSTITUTIONAL_EXTERNAL",
            source:
              "instrument.identity",
            loginEnabled:
              false,
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          name: true,
          isAdmin: true,
        },
      });

    identityCreated =
      true;
  }

  /*
   * Existing AXPT users are reused rather than
   * silently rewritten by the instrument domain.
   */
  const existingParty =
    await params.client.instrumentParty.findFirst({
      where: {
        instrumentId:
          instrument.id,
        userId:
          user.id,
        role:
          partyRole,
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        role: true,
        authorityClass: true,
        createdAt: true,
      },
    });

  if (existingParty) {
    return {
      instrument,
      user,
      party:
        existingParty,
      identityCreated,
      partyCreated:
        false,
    } as const;
  }

  const occurredAt =
    params.occurredAt ??
    new Date();

  const party =
    await params.client.instrumentParty.create({
      data: {
        instrumentId:
          instrument.id,
        userId:
          user.id,
        displayName:
          displayName,
        role:
          partyRole,
        authorityClass:
          null,
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        role: true,
        authorityClass: true,
        createdAt: true,
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
          .INSTRUMENT_PARTY_BOUND,
      payload: {
        partyId:
          party.id,
        userId:
          user.id,
        displayName:
          party.displayName,
        role:
          party.role,
        identityCreated,
      },
      metadata: {
        actorUserId:
          params.createdByUserId,
        source:
          "instrument.command.ensure-participant-identity",
      },
      occurredAt,
    },
  });

  return {
    instrument,
    user,
    party,
    identityCreated,
    partyCreated:
      true,
  } as const;
}
