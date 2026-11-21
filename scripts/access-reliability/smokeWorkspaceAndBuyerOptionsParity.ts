import type { BuyerDossierOption } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsWithClient";
import assert from "node:assert/strict";
import { prisma as db } from "../../src/infrastructure/db/prisma";
import { loadRepresentativeWorkspace } from "../../src/domains/instruments/representative-program/application/loadRepresentativeWorkspace";
import { loadRepresentativeWorkspaceSnapshotWithClient } from "../../src/domains/instruments/representative-program/application/loadRepresentativeWorkspaceSnapshotWithClient";
import { loadRepresentativeCommercialUtilityPackSnapshotWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackSnapshotWithClient";
import { loadBuyerDossierOptionsWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsWithClient";
import { loadBuyerDossierOptionsBatchedWithClient } from "../../src/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsBatchedWithClient";

async function timed<T>(stage: string, operation: () => Promise<T>) {
  const started = Date.now();
  const result = await operation();
  console.log({ stage, elapsedMs: Date.now() - started });
  return result;
}
async function main() {
  const participantId = process.argv[2];
  assert.ok(participantId, "Participant ID required");
  const participant = await db.representativeProgramParticipant.findUnique({
    where: { id: participantId }, select: { userId: true },
  });
  assert.ok(participant?.userId, "Participant link required");
  const userId = participant.userId;
  const previous = await timed("previousWorkspace", () => loadRepresentativeWorkspace(userId));
  assert.ok(previous, "Existing workspace required");
  for (let pass = 1; pass <= 2; pass++) {
    const current = await timed(`singleWorkspaceRead:${pass}`, () =>
      loadRepresentativeWorkspaceSnapshotWithClient({ client: db, userId }));
    assert.deepStrictEqual(current, previous);
  }
  console.log("PASS: exact workspace parity including dates and latest appointment");
  const pack = await loadRepresentativeCommercialUtilityPackSnapshotWithClient({ client: db, userId });
  assert.ok(pack, "Visible CUP required");
  const options = await timed("previousBuyerOptions", () =>
    loadBuyerDossierOptionsWithClient({ client: db, userId, pack }));
  for (let pass = 1; pass <= 2; pass++) {
    const current: BuyerDossierOption[] = await timed(`batchedBuyerOptions:${pass}`, () =>
      loadBuyerDossierOptionsBatchedWithClient({ client: db, userId, pack }));
    assert.deepStrictEqual(current, options);
  }
  console.log("PASS: exact buyer option order, labels and transmission permissions");
  assert.deepStrictEqual(await loadBuyerDossierOptionsBatchedWithClient({ client: db, userId, pack: null }), []);
  const missingUser = "arp-workspace-parity-nonexistent-user";
  assert.equal(await loadRepresentativeWorkspace(missingUser), null);
  assert.equal(await loadRepresentativeWorkspaceSnapshotWithClient({ client: db, userId: missingUser }), null);
  await assert.rejects(loadRepresentativeWorkspaceSnapshotWithClient({ client: db, userId: " " }), /REPRESENTATIVE_WORKSPACE_USER_REQUIRED/);
  console.log("PASS: missing workspace, empty identity and absent CUP");
}
main().catch(error => {
  console.error({ failed: true, code: typeof error.code === "string" ? error.code : error.name });
  process.exitCode = 1;
}).finally(() => db.$disconnect());
