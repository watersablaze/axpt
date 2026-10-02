import * as assert from "node:assert/strict";

import {
  bindRepresentativeMasterAgreement,
} from "../../src/domains/instruments/representative-program/onboarding/commands/bindRepresentativeMasterAgreement";

function fixture() {
  const state: any = {
    intake: {
      id: "intake-1",
      status: "ADMITTED",
      candidateEmail: "jens@example.test",
      admittedParticipantId: "participant-1",
      masterAgreementInstrumentId: null,
    },
    agreement: {
      id: "agreement-1",
      kind: "REPRESENTATIVE_PROGRAM_AGREEMENT",
      status: "EXECUTED",
      evidence: [{
        id: "signed-pdf-1",
        evidenceType: "DOCUMENT",
        subjectType: "EXECUTION",
        uri: "private://signed-agreement.pdf",
        contentHash: "a".repeat(64),
        metadata: {
          signerEmail: "jens@example.test",
          adobeAgreementId: "acrobat-1",
          operatorConfirmedAllSignatures: true,
        },
      }, {
        id: "audit-1",
        evidenceType: "EXTERNAL_RECORD",
        subjectType: "EXECUTION",
        uri: "private://acrobat-audit.pdf",
        contentHash: "b".repeat(64),
        metadata: {
          signerEmail: "jens@example.test",
          adobeAgreementId: "acrobat-1",
          operatorConfirmedAllSignatures: true,
        },
      }],
    },
    events: [],
    concurrentChange: false,
    eventFailure: false,
    actorIsAdmin: true,
  };

  const tx: any = {
    user: {
      findUnique: async ({ where }: any) =>
        where.id === "operator-1"
          ? { isAdmin: state.actorIsAdmin }
          : null,
    },
    representativeOnboardingIntake: {
      findUnique: async ({ where }: any) =>
        where.id === state.intake.id ? state.intake : null,
      updateMany: async ({ where, data }: any) => {
        if (
          state.concurrentChange ||
          state.intake.id !== where.id ||
          state.intake.status !== where.status ||
          state.intake.admittedParticipantId !== where.admittedParticipantId ||
          state.intake.masterAgreementInstrumentId !==
            where.masterAgreementInstrumentId
        ) {
          return { count: 0 };
        }
        state.intake.masterAgreementInstrumentId =
          data.masterAgreementInstrumentId;
        return { count: 1 };
      },
    },
    institutionalInstrument: {
      findUnique: async ({ where }: any) =>
        where.reference === "FWI-JENS-MASTER-1"
          ? state.agreement
          : null,
    },
    domainEvent: {
      create: async ({ data }: any) => {
        if (state.eventFailure) throw new Error("EVENT_WRITE_FAILED");
        state.events.push(data);
        return data;
      },
    },
  };

  const runner: any = {
    $transaction: async (operation: any) => {
      const before = structuredClone({
        intake: state.intake,
        events: state.events,
      });
      try {
        return await operation(tx);
      } catch (error) {
        state.intake = before.intake;
        state.events = before.events;
        throw error;
      }
    },
  };

  return { state, runner };
}

function bind(f: ReturnType<typeof fixture>) {
  return bindRepresentativeMasterAgreement({
    client: f.runner,
    intakeId: "intake-1",
    instrumentReference: "FWI-JENS-MASTER-1",
    actorUserId: "operator-1",
  });
}

async function mustReject(
  f: ReturnType<typeof fixture>,
  code: string,
) {
  await assert.rejects(
    () => bind(f),
    (error: unknown) =>
      error instanceof Error && error.message.includes(code),
  );
  assert.equal(f.state.intake.masterAgreementInstrumentId, null);
  assert.equal(f.state.events.length, 0);
}

async function main() {
  const nonAdmin = fixture();
  nonAdmin.state.actorIsAdmin = false;
  await mustReject(nonAdmin, "ADMIN_REQUIRED");

  const unadmitted = fixture();
  unadmitted.state.intake.status = "QUALIFIED";
  unadmitted.state.intake.admittedParticipantId = null;
  await mustReject(unadmitted, "ADMISSION_REQUIRED");

  const wrongSigner = fixture();
  wrongSigner.state.agreement.evidence[0].metadata.signerEmail =
    "someone-else@example.test";
  await mustReject(wrongSigner, "SIGNED_EVIDENCE_REQUIRED");

  const missingHash = fixture();
  missingHash.state.agreement.evidence[0].contentHash = null;
  await mustReject(missingHash, "SIGNED_EVIDENCE_REQUIRED");

  const missingAudit = fixture();
  missingAudit.state.agreement.evidence.pop();
  await mustReject(missingAudit, "AUDIT_EVIDENCE_REQUIRED");

  const wrongAuditAgreement = fixture();
  wrongAuditAgreement.state.agreement.evidence[1].metadata.adobeAgreementId =
    "another-acrobat-agreement";
  await mustReject(wrongAuditAgreement, "AUDIT_EVIDENCE_REQUIRED");

  const wrongAuditSigner = fixture();
  wrongAuditSigner.state.agreement.evidence[1].metadata.signerEmail =
    "someone-else@example.test";
  await mustReject(wrongAuditSigner, "AUDIT_EVIDENCE_REQUIRED");

  const missingAuditHash = fixture();
  missingAuditHash.state.agreement.evidence[1].contentHash = null;
  await mustReject(missingAuditHash, "AUDIT_EVIDENCE_REQUIRED");

  const unconfirmedSignatures = fixture();
  unconfirmedSignatures.state.agreement.evidence[0]
    .metadata.operatorConfirmedAllSignatures = false;
  await mustReject(unconfirmedSignatures, "AUDIT_EVIDENCE_REQUIRED");

  const concurrent = fixture();
  concurrent.state.concurrentChange = true;
  await mustReject(concurrent, "CONCURRENT_CHANGE");

  const failedEvent = fixture();
  failedEvent.state.eventFailure = true;
  await mustReject(failedEvent, "EVENT_WRITE_FAILED");

  const valid = fixture();
  const first = await bind(valid);
  assert.equal(first.bound, true);
  assert.equal(valid.state.intake.masterAgreementInstrumentId, "agreement-1");
  assert.equal(valid.state.events.length, 1);
  assert.equal(
    valid.state.events[0].eventType,
    "REPRESENTATIVE_MASTER_AGREEMENT_BOUND",
  );

  assert.equal(
    valid.state.events[0].payload.executionEvidenceId,
    "signed-pdf-1",
  );
  assert.equal(valid.state.events[0].payload.auditEvidenceId, "audit-1");
  assert.equal(valid.state.events[0].payload.adobeAgreementId, "acrobat-1");

  valid.state.actorIsAdmin = false;
  await assert.rejects(
    () => bind(valid),
    /ARP_MASTER_AGREEMENT_ADMIN_REQUIRED/,
  );
  assert.equal(valid.state.events.length, 1);

  valid.state.actorIsAdmin = true;
  const repeat = await bind(valid);
  assert.equal(repeat.bound, false);
  assert.equal(valid.state.events.length, 1);

  process.stdout.write("ARP_MASTER_AGREEMENT_BINDING_SMOKE_OK\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
