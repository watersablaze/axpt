import { strict as assert } from "node:assert";

import { assembleMasterAgreementEvidence } from "../../src/domains/instruments/representative-program/onboarding/commands/assembleMasterAgreementEvidence";
import { recordMasterAgreementExecution } from "../../src/domains/instruments/representative-program/onboarding/commands/recordMasterAgreementExecution";

const pdf = (body: string) =>
  new TextEncoder().encode(`%PDF-1.7\n${body}`);

async function receipt(signerEmail = "jens@example.test") {
  return assembleMasterAgreementEvidence({
    store: {
      async putPrivate(input) {
        return {
          uri: `s3://arp-private-evidence/${input.key}`,
          access: "private",
        };
      },
    },
    reference: "ARP-MASTER-JENS-001",
    signerEmail,
    adobeAgreementId: "adobe-agreement-1",
    completedAt: new Date("2026-09-24T10:00:00.000Z"),
    reviewedByUserId: "admin-1",
    reviewedAt: new Date("2026-09-24T11:00:00.000Z"),
    operatorConfirmedAllSignatures: true,
    signedPdf: pdf("signed agreement"),
    auditPdf: pdf("audit report"),
  });
}

function fixture(isAdmin = true, failAtEventCreate = 0) {
  let state: any = {
    instrument: {
      id: "agreement-1",
      reference: "ARP-MASTER-JENS-001",
      kind: "REPRESENTATIVE_PROGRAM_AGREEMENT",
      status: "DRAFT",
      versions: [
        {
          id: "version-1",
          number: 1,
          status: "DRAFT",
          issuedAt: null,
        },
      ],
      evidence: [
        {
          id: "designation-1",
          evidenceType: "ATTESTATION",
          subjectType: "INSTRUMENT",
          metadata: { candidateEmail: "jens@example.test" },
        },
      ],
    },
    events: [],
    transitions: [],
  };

  const runner = {
    async $transaction<T>(operation: (tx: any) => Promise<T>): Promise<T> {
      const draft = structuredClone(state);
      let eventCreates = 0;

      const tx = {
        user: {
          findUnique: async () => ({ isAdmin }),
        },
        institutionalInstrument: {
          findUnique: async () => draft.instrument,
          updateMany: async ({ where, data }: any) => {
            if (
              draft.instrument.id !== where.id ||
              draft.instrument.status !== where.status
            ) {
              return { count: 0 };
            }
            draft.instrument.status = data.status;
            return { count: 1 };
          },
        },
        instrumentVersion: {
          updateMany: async ({ where, data }: any) => {
            const version = draft.instrument.versions[0];
            if (
              version.id !== where.id ||
              version.status !== where.status ||
              version.issuedAt !== where.issuedAt
            ) {
              return { count: 0 };
            }
            Object.assign(version, data);
            return { count: 1 };
          },
        },
        instrumentEvidence: {
          create: async ({ data }: any) => {
            const evidence = {
              id: `execution-evidence-${draft.instrument.evidence.length}`,
              ...data,
              createdAt: new Date(),
            };
            draft.instrument.evidence.push(evidence);
            return evidence;
          },
        },
        instrumentAuthority: {
          findUnique: async () => null,
        },
        instrumentStateTransition: {
          create: async ({ data }: any) => {
            const transition = {
              id: `transition-${draft.transitions.length + 1}`,
              ...data,
            };
            draft.transitions.push(transition);
            return transition;
          },
        },
        domainEvent: {
          create: async ({ data }: any) => {
            eventCreates += 1;
            if (eventCreates === failAtEventCreate) {
              throw new Error("EVENT_WRITE_FAILED");
            }
            draft.events.push(data);
          },
          createMany: async ({ data }: any) => {
            draft.events.push(...data);
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
  };
}

type Fixture = ReturnType<typeof fixture>;

function record(environment: Fixture, evidence: Awaited<ReturnType<typeof receipt>>) {
  return recordMasterAgreementExecution({
    client: environment.runner as never,
    receipt: evidence,
  });
}

async function main() {
  const evidence = await receipt();

  const unauthorized = fixture(false);
  await assert.rejects(
    record(unauthorized, evidence),
    /ARP_MASTER_AGREEMENT_ADMIN_REQUIRED/,
  );
  assert.equal(unauthorized.state.instrument.status, "DRAFT");

  const wrongSigner = fixture();
  await assert.rejects(
    record(wrongSigner, await receipt("other@example.test")),
    /ARP_MASTER_AGREEMENT_SIGNER_MISMATCH/,
  );
  assert.equal(wrongSigner.state.instrument.status, "DRAFT");

  const valid = fixture();
  const first = await record(valid, evidence);
  assert.equal(first.executed, true);
  assert.equal(valid.state.instrument.status, "EXECUTED");
  assert.equal(valid.state.instrument.versions[0].status, "ISSUED");
  assert.equal(valid.state.instrument.evidence.length, 3);
  assert.equal(valid.state.transitions.length, 2);
  assert.equal(valid.state.events.length, 7);

  const repeat = await record(valid, evidence);
  assert.equal(repeat.executed, false);
  assert.equal(valid.state.instrument.evidence.length, 3);
  assert.equal(valid.state.events.length, 7);

  const incomplete = fixture();
  await record(incomplete, evidence);
  incomplete.state.instrument.evidence.pop();
  await assert.rejects(
    record(incomplete, evidence),
    /ARP_MASTER_AGREEMENT_EXECUTION_CONFLICT/,
  );

  const failed = fixture(true, 3);
  await assert.rejects(
    record(failed, evidence),
    /EVENT_WRITE_FAILED/,
  );
  assert.equal(failed.state.instrument.status, "DRAFT");
  assert.equal(failed.state.instrument.versions[0].status, "DRAFT");
  assert.equal(failed.state.instrument.evidence.length, 1);
  assert.equal(failed.state.events.length, 0);

  process.stdout.write("ARP_MASTER_AGREEMENT_EXECUTION_SMOKE_OK\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
