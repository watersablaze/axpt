import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { loadRepresentativeCommercialUtilityPackWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackWithClient";
import { loadRepresentativeCommercialUtilityPackSnapshotWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackSnapshotWithClient";

const db = new PrismaClient({ log: [] });
async function main() {
  const participantId = process.argv[2];
  assert.ok(participantId, "Participant ID argument required");
  const participant = await db.representativeProgramParticipant.findUnique({
    where: { id: participantId }, select: { userId: true },
  });
  assert.ok(participant?.userId, "Participant user link required");
  const userId = participant.userId;
  const started = Date.now();
  const previous = await loadRepresentativeCommercialUtilityPackWithClient({ client: db, userId });
  assert.ok(previous, "Released visible CUP required for comparison");
  console.log({ stage: "previousCUPRead", elapsedMs: Date.now() - started });
  for (let pass = 1; pass <= 2; pass++) {
    const started = Date.now();
    const current = await loadRepresentativeCommercialUtilityPackSnapshotWithClient({ client: db, userId });
    assert.deepStrictEqual(current, previous);
    console.log({ stage: "singleCUPRead", pass, elapsedMs: Date.now() - started, parity: "PASS" });
  }
  const missingUser = "arp-cup-parity-nonexistent-user";
  assert.equal(await loadRepresentativeCommercialUtilityPackWithClient({ client: db, userId: missingUser }), null);
  assert.equal(await loadRepresentativeCommercialUtilityPackSnapshotWithClient({ client: db, userId: missingUser }), null);
  await assert.rejects(
    loadRepresentativeCommercialUtilityPackSnapshotWithClient({ client: db, userId: "  " }),
    /REPRESENTATIVE_CUP_USER_REQUIRED/,
  );
  console.log("PASS: missing user and empty user guards");
}
main().catch(error => {
  console.error({ failed: true, code: typeof error.code === "string" ? error.code : error.name });
  process.exitCode = 1;
}).finally(() => db.$disconnect());
