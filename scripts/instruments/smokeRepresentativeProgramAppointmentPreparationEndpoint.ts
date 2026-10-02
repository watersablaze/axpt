import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

import { SignJWT } from "jose";

import { prisma } from "../../src/infrastructure/db/prisma";
import { SIGNING_SECRET } from "../../src/infrastructure/env/secrets";

const endpoint = process.env.ARP_APPT_PREPARATION_ENDPOINT;
const participantId = process.env.ARP_TEST_PARTICIPANT_ID;

if (!endpoint) {
  throw new Error("ARP_APPT_ENDPOINT_REQUIRED");
}

if (!participantId) {
  throw new Error("ARP_TEST_PARTICIPANT_ID_REQUIRED");
}

const OPERATOR_EMAIL = process.env.ARP_TEST_OPERATOR_EMAIL ?? "connect@axpt.io";

const execFileAsync = promisify(execFile);

async function post(cookie?: string) {
  const args = [
    "curl",
    endpoint!,
    "--silent",
    "--show-error",
    "--request",
    "POST",
    "--header",
    "content-type: application/json",
    "--data",
    JSON.stringify({
      participantId,
    }),
    "--write-out",
    "\\n__HTTP_STATUS__:%{http_code}\\n",
  ];

  if (cookie) {
    args.push("--header", `Cookie: ${cookie}`);
  }

  const { stdout, stderr } = await execFileAsync("vercel", args, {
    maxBuffer: 1024 * 1024,
  });

  if (stderr.trim()) {
    process.stderr.write(stderr);
  }

  const marker = /\n__HTTP_STATUS__:(\d{3})\s*$/;
  const match = stdout.match(marker);

  if (!match || match.index === undefined) {
    throw new Error(`ARP_APPT_1B1_VERCEL_CURL_STATUS_MISSING:${stdout}`);
  }

  const status = Number(match[1]);
  const body = stdout.slice(0, match.index).trim();

  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return JSON.parse(body);
    },
  };
}

async function main() {
  const reference = `${participantId}-APPT-001`;

  const existing = await prisma.institutionalInstrument.findUnique({
    where: {
      reference,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new Error(`ARP_APPT_1B1_REFERENCE_NOT_CLEAN:${reference}`);
  }

  console.log("✓ APPT reference is initially absent");

  const unauthenticated = await post();
  assert.equal(unauthenticated.status, 401);

  console.log("✓ unauthenticated request rejected with 401");

  const operator = await prisma.user.findUnique({
    where: {
      email: OPERATOR_EMAIL,
    },
    include: {
      userRoles: {
        where: {
          isActive: true,
          revokedAt: null,
        },
        include: {
          role: true,
        },
      },
    },
  });

  if (!operator) {
    throw new Error("ARP_APPT_1B1_OPERATOR_NOT_FOUND");
  }

  assert.equal(
    operator.isAdmin,
    true,
    "operator must satisfy persisted User.isAdmin",
  );

  const operatorRoles = operator.userRoles as Array<{
    role: {
      key: string;
    };
  }>;

  assert.ok(
    operatorRoles.some((userRole) => userRole.role.key === "ADMIN_PLATFORM"),
    "operator must carry active ADMIN_PLATFORM role",
  );

  console.log("✓ operator satisfies User.isAdmin");
  console.log("✓ operator carries active ADMIN_PLATFORM role");

  const tokenId = randomUUID();
  const now = new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const exp = Math.floor(expiresAt.getTime() / 1000);

  await prisma.session.create({
    data: {
      userId: operator.id,
      tokenId,
      status: "active",
      startedAt: now,
      expiresAt,
      userAgent: "APPT-1B.1 endpoint smoke",
      deviceInfo: "APPT-1B.1 endpoint smoke",
    },
  });

  let instrumentId: string | null = null;
  let appointmentId: string | null = null;

  try {
    const token = await new SignJWT({
      userId: operator.id,
      tokenId,
      tier: operator.tier ?? "operations",
      roles: operatorRoles.map((userRole) => userRole.role.key),
      displayName: operator.displayName ?? operator.name ?? "AR3E Runtime",
      popupMessage: "APPT-1B.1 endpoint smoke",
      greeting: "APPT-1B.1",
      email: operator.email,
      partner: "AXPT",
      docs: ["whitepaper"],
      iat,
      exp,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(SIGNING_SECRET);

    const cookie = `axpt_session=${token}`;

    const response = await post(cookie);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.ok, true);
    assert.equal(payload.appointment.status, undefined);
    assert.equal(
      payload.appointment.appointmentForm,
      "INDIVIDUAL_REPRESENTATION",
    );
    assert.equal(
      payload.appointment.appointmentClass,
      "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",
    );
    assert.equal(payload.appointment.created, true);
    assert.equal(payload.authority.created, false);
    assert.equal(payload.activation.performed, false);

    instrumentId = payload.appointment.instrumentId;
    appointmentId = payload.appointment.appointmentId;

    assert.ok(instrumentId);
    assert.ok(appointmentId);

    console.log("✓ authenticated admin request succeeded");
    console.log("✓ Appointment Instrument prepared through HTTP");
    console.log("✓ Appointment Form is INDIVIDUAL_REPRESENTATION");
    console.log("✓ Appointment Class is AUTHORIZED_COMMERCIAL_REPRESENTATIVE");
    console.log("✓ authority remains NOT_CREATED");
    console.log("✓ activation remains unperformed");

    const repeat = await post(cookie);
    const repeatPayload = await repeat.json();

    assert.equal(repeat.status, 200);
    assert.equal(repeatPayload.ok, true);
    assert.equal(repeatPayload.appointment.created, false);
    assert.equal(repeatPayload.appointment.instrumentId, instrumentId);
    assert.equal(repeatPayload.appointment.appointmentId, appointmentId);

    console.log("✓ authenticated replay is idempotent");

    console.log("ARP_APPT_1B1_ENDPOINT_OK");
  } finally {
    if (appointmentId) {
      await prisma.representativeProgramAppointment.delete({
        where: {
          id: appointmentId,
        },
      });
    }

    if (instrumentId) {
      await prisma.domainEvent.deleteMany({
        where: {
          streamId: {
            in: [instrumentId, appointmentId].filter((value): value is string =>
              Boolean(value),
            ),
          },
        },
      });

      await prisma.institutionalInstrument.delete({
        where: {
          id: instrumentId,
        },
      });
    }

    await prisma.session.delete({
      where: {
        tokenId,
      },
    });

    console.log("✓ temporary session removed");
    console.log("✓ APPT-1 endpoint fixture removed");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
