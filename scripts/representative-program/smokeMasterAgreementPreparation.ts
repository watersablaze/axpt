import { strict as assert } from "node:assert";

import { prepareRepresentativeMasterAgreement } from "../../src/domains/instruments/representative-program/onboarding/commands/prepareRepresentativeMasterAgreement";

function fixture(isAdmin = true) {
  let state: any = { instrument: null, events: [] };
  let failEvidenceEvent = false;

  const runner = {
    async $transaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
      const draft = structuredClone(state);

      const tx = {
        user: {
          findUnique: async () => ({ isAdmin }),
        },
        institutionalInstrument: {
          findUnique: async () => draft.instrument,
          create: async ({ data }: any) => {
            draft.instrument = {
              id: "agreement-1",
              reference: data.reference,
              title: data.title,
              kind: data.kind,
              status: data.status,
              versions: [
                { id: "version-1", ...data.versions.create },
              ],
              parties: data.parties.create,
              evidence: [],
            };
            return draft.instrument;
          },
        },
        instrumentEvidence: {
          create: async ({ data }: any) => {
            const evidence = {
              id: "evidence-1",
              ...data,
              createdAt: new Date(),
            };
            draft.instrument.evidence.push(evidence);
            return evidence;
          },
        },
        domainEvent: {
          createMany: async ({ data }: any) => {
            draft.events.push(...data);
          },
          create: async ({ data }: any) => {
            if (failEvidenceEvent) {
              throw new Error("EVENT_WRITE_FAILED");
            }
            draft.events.push(data);
          },
        },
      };

      const result = await operation(tx);
      state = draft;
      return result;
    },
  };

  return {
    runner,
    get state() {
      return state;
    },
    failNextEvidenceEvent() {
      failEvidenceEvent = true;
    },
  };
}

type Fixture = ReturnType<typeof fixture>;

function prepare(
  environment: Fixture,
  candidateEmail = "jens@example.test",
) {
  return prepareRepresentativeMasterAgreement({
    client: environment.runner as never,
    reference: "ARP-MASTER-JENS-001",
    title: "French-Ward Representative Program Master Agreement",
    candidateDisplayName: "Jens Peter Thomsen",
    candidateEmail,
    actorUserId: "admin-1",
  });
}

async function main() {
  const unauthorized = fixture(false);
  await assert.rejects(
    prepare(unauthorized),
    /ARP_MASTER_AGREEMENT_ADMIN_REQUIRED/,
  );
  assert.equal(unauthorized.state.instrument, null);

  const valid = fixture();
  const first = await prepare(valid);
  assert.equal(first.created, true);
  assert.equal(valid.state.instrument.status, "DRAFT");
  assert.equal(valid.state.instrument.versions[0].status, "DRAFT");
  assert.equal(valid.state.instrument.versions[0].issuedAt, undefined);
  assert.deepEqual(
    valid.state.events.map((event: any) => event.eventType),
    [
      "INSTRUMENT_CREATED",
      "INSTRUMENT_VERSION_CREATED",
      "INSTRUMENT_EVIDENCE_RECORDED",
    ],
  );

  const repeat = await prepare(valid);
  assert.equal(repeat.created, false);
  assert.equal(valid.state.events.length, 3);

  await assert.rejects(
    prepare(valid, "another@example.test"),
    /ARP_MASTER_AGREEMENT_REFERENCE_CONFLICT/,
  );
  assert.equal(valid.state.events.length, 3);

  const incoherent = fixture();
  await prepare(incoherent);
  incoherent.state.instrument.status = "EXECUTED";
  await assert.rejects(
    prepare(incoherent),
    /ARP_MASTER_AGREEMENT_REFERENCE_CONFLICT/,
  );

  const failedEvent = fixture();
  failedEvent.failNextEvidenceEvent();
  await assert.rejects(
    prepare(failedEvent),
    /EVENT_WRITE_FAILED/,
  );
  assert.equal(failedEvent.state.instrument, null);
  assert.equal(failedEvent.state.events.length, 0);

  process.stdout.write("ARP_MASTER_AGREEMENT_PREPARATION_SMOKE_OK\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
