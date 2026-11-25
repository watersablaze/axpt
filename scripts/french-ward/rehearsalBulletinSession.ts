import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import {
  verifySignedPersistedSession,
} from "../../src/lib/auth/verifySignedPersistedSession";

const expected = "axpt_fw_bulletin_r1_rehearsal";
const url = new URL(process.env.DATABASE_URL ?? "");

assert.equal(url.protocol, "postgresql:");
assert.equal(url.hostname, "127.0.0.1");
assert.equal(url.port, "5433");
assert.equal(url.pathname, `/${expected}`);
assert.equal(url.username, "axpt");
assert.ok(url.password);
assert.equal(url.search, "");

const db = new PrismaClient();
const secret = randomBytes(32);
const tokenId = randomUUID();
const publisherId = "fw-bulletin-r1-publisher";
const readerId = "fw-bulletin-r1-reader";

async function main() {
  const identity = await db.$queryRaw<
    Array<{ db: string; actor: string }>
  >`SELECT current_database() AS db, current_user AS actor`;

  assert.deepEqual(identity, [{ db: expected, actor: "axpt" }]);

  const [publisher, reader, existingSessions] = await Promise.all([
    db.user.findUnique({ where: { id: publisherId } }),
    db.user.findUnique({ where: { id: readerId } }),
    db.session.count(),
  ]);

  assert.ok(publisher);
  assert.ok(reader);
  assert.equal(existingSessions, 0);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60_000);

  try {
    await db.session.create({
      data: {
        userId: publisherId,
        tokenId,
        status: "active",
        expiresAt,
      },
    });

    const token = await new SignJWT({
      userId: publisherId,
      tokenId,
      email: publisher.email,
      tier: "french-ward-governance",
      displayName: publisher.displayName,
      roles: [],
      docs: [],
      popupMessage: "Rehearsal",
      greeting: "Rehearsal",
      partner: "French-Ward",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(secret);

    const lookup = (id: string) =>
      db.session.findUnique({
        where: { tokenId: id },
        select: {
          userId: true,
          status: true,
          expiresAt: true,
          invalidatedAt: true,
          endedAt: true,
        },
      });

    const valid = await verifySignedPersistedSession(
      token, secret, lookup
    );

    assert.equal(valid?.userId, publisherId);
    console.log("PASS signed persisted session verified");

    const mismatch = await verifySignedPersistedSession(
      token,
      secret,
      async id => {
        const record = await lookup(id);
        return record ? { ...record, userId: readerId } : null;
      },
    );

    assert.equal(mismatch, null);
    console.log("PASS mismatched actor denied");

    await db.session.update({
      where: { tokenId },
      data: {
        invalidatedAt: new Date(),
        status: "revoked",
      },
    });

    const revoked = await verifySignedPersistedSession(
      token, secret, lookup
    );

    assert.equal(revoked, null);
    console.log("PASS revoked persisted session denied");

    const wrongSignature = await verifySignedPersistedSession(
      token, randomBytes(32), lookup
    );

    assert.equal(wrongSignature, null);
    console.log("PASS invalid signing key denied");
  } finally {
    await db.session.deleteMany({
      where: {
        tokenId,
        userId: publisherId,
      },
    });
  }

  assert.equal(await db.session.count(), 0);
  console.log("PASS temporary session removed");
  console.log("5/5 persisted-session checks PASS");
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
