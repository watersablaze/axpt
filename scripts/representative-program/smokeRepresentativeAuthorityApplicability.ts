import assert from "node:assert/strict";

import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTITUTIONAL_INSTRUMENT_STATUS,
  INSTRUMENT_AUTHORITY_CLASS,
} from "../../src/domains/instruments/contracts";

import {
  REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON,
  REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON,
  REPRESENTATIVE_AUTHORITY_KEY,
  REPRESENTATIVE_PROGRAM_STANDING,
  resolveRepresentativeProgramAuthorityApplicabilityWithClient,
} from "../../src/domains/instruments/representative-program";

type Conditions = Readonly<{
  transactionReferences?: readonly string[];
  counterpartyReferences?: readonly string[];
  territory?: readonly string[];
  requiresPriorApproval?: boolean;
  approvalAuthority?: string;
  documentClasses?: readonly string[];
  monetaryLimit?: string;
  allowWhileRestricted?: boolean;
  notes?: string;
}>;

function client(params?: Readonly<{
  standing?: string;
  authorityClass?: string;
  conditions?: Conditions;
  authorityPresent?: boolean;
}>) {
  const now =
    new Date("2026-10-06T12:00:00.000Z");

  const appointment = {
    id:
      "appointment-1",

    participantId:
      "participant-1",

    appointmentClass:
      "AUTHORIZED_COMMERCIAL_REPRESENTATIVE",

    effectiveAt:
      new Date("2026-10-01T00:00:00.000Z"),

    expiresAt:
      new Date("2026-12-31T00:00:00.000Z"),

    endedAt:
      null,

    participant: {
      standing:
        params?.standing ??
        REPRESENTATIVE_PROGRAM_STANDING.ACTIVE,
    },

    instrument: {
      id:
        "appointment-instrument-1",

      reference:
        "FWI-26-RP-001-APPT-001",

      kind:
        INSTITUTIONAL_INSTRUMENT_KIND
          .REPRESENTATIVE_APPOINTMENT,

      status:
        INSTITUTIONAL_INSTRUMENT_STATUS.ACTIVE,
    },

    instrumentId:
      "appointment-instrument-1",

    instrumentPartyId:
      "appointment-party-1",

    instrumentParty: {
      id:
        "appointment-party-1",

      instrumentId:
        "appointment-instrument-1",
    },
  };

  const authority = {
    id:
      "authority-1",

    instrumentId:
      "appointment-instrument-1",

    authorityKey:
      REPRESENTATIVE_AUTHORITY_KEY
        .PRESENTATION,

    title:
      "Presentation Authority",

    authorityClass:
      params?.authorityClass ??
      INSTRUMENT_AUTHORITY_CLASS.DELEGATED,

    holderPartyId:
      "appointment-party-1",

    action:
      "Present released institutional materials",

    conditions:
      params?.conditions ?? {},

    effectiveAt:
      new Date("2026-10-01T00:00:00.000Z"),

    expiresAt:
      new Date("2026-12-31T00:00:00.000Z"),

    revokedAt:
      null,

    createdByUserId:
      "operator-1",
  };

  return {
    now,

    client: {
      representativeProgramAppointment: {
        findUnique:
          async () =>
            appointment,
      },

      instrumentAuthority: {
        findMany:
          async () =>
            params?.authorityPresent === false
              ? []
              : [authority],
      },
    },
  } as const;
}

async function evaluate(
  conditions: Conditions,
  context: Readonly<{
    transactionReference?: string;
    counterpartyReference?: string;
    territory?: string;
    documentClass?: string;
    approvalReference?: string;
    monetaryContext?: Readonly<{
      amount: string;
      currency: string;
    }>;
  }> = {},
  options?: Readonly<{
    standing?: string;
    authorityClass?: string;
    authorityPresent?: boolean;
  }>,
) {
  const fixture =
    client({
      conditions,
      ...options,
    });

  return resolveRepresentativeProgramAuthorityApplicabilityWithClient({
    client:
      fixture.client as never,

    request: {
      appointmentId:
        "appointment-1",

      authorityKey:
        REPRESENTATIVE_AUTHORITY_KEY
          .PRESENTATION,

      context,

      at:
        fixture.now,
    },
  });
}

async function main() {
  const unrestricted =
    await evaluate({});

  assert.equal(
    unrestricted.applicable,
    true,
  );

  assert.equal(
    unrestricted.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .APPLICABLE,
  );

  console.log(
    "✓ unrestricted exercisable authority is applicable",
  );

  const noAuthority =
    await evaluate(
      {},
      {},
      {
        authorityPresent:
          false,
      },
    );

  assert.equal(
    noAuthority.applicable,
    false,
  );

  assert.equal(
    noAuthority.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .AUTHORITY_NOT_EXERCISABLE,
  );

  assert.equal(
    noAuthority.exercisabilityReason,
    REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON
      .AUTHORITY_NOT_RECORDED,
  );

  console.log(
    "✓ non-exercisable authority fails closed",
  );

  const counterpartyMissing =
    await evaluate({
      counterpartyReferences: [
        "BUYER-001",
      ],
    });

  assert.equal(
    counterpartyMissing.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .COUNTERPARTY_REFERENCE_REQUIRED,
  );

  console.log(
    "✓ scoped authority requires counterparty context",
  );

  const counterpartyWrong =
    await evaluate(
      {
        counterpartyReferences: [
          "BUYER-001",
        ],
      },
      {
        counterpartyReference:
          "BUYER-999",
      },
    );

  assert.equal(
    counterpartyWrong.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .COUNTERPARTY_OUT_OF_SCOPE,
  );

  console.log(
    "✓ out-of-scope counterparty rejected",
  );

  const counterpartyAllowed =
    await evaluate(
      {
        counterpartyReferences: [
          "BUYER-001",
        ],
      },
      {
        counterpartyReference:
          "BUYER-001",
      },
    );

  assert.equal(
    counterpartyAllowed.applicable,
    true,
  );

  console.log(
    "✓ in-scope counterparty accepted",
  );

  const documentMissing =
    await evaluate({
      documentClasses: [
        "SOURCE_AUTHORITY_PRESENTATION",
      ],
    });

  assert.equal(
    documentMissing.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .DOCUMENT_CLASS_REQUIRED,
  );

  console.log(
    "✓ document-scoped authority requires document class",
  );

  const documentWrong =
    await evaluate(
      {
        documentClasses: [
          "SOURCE_AUTHORITY_PRESENTATION",
        ],
      },
      {
        documentClass:
          "COMMERCIAL_PROFILE",
      },
    );

  assert.equal(
    documentWrong.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .DOCUMENT_CLASS_OUT_OF_SCOPE,
  );

  console.log(
    "✓ out-of-scope document class rejected",
  );

  const approvalMissing =
    await evaluate({
      requiresPriorApproval:
        true,

      approvalAuthority:
        "French-Ward Administration",
    });

  assert.equal(
    approvalMissing.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .PRIOR_APPROVAL_REQUIRED,
  );

  assert.equal(
    approvalMissing.approvalAuthority,
    "French-Ward Administration",
  );

  console.log(
    "✓ prior approval requirement fails closed without evidence reference",
  );

  const approved =
    await evaluate(
      {
        requiresPriorApproval:
          true,

        approvalAuthority:
          "French-Ward Administration",
      },
      {
        approvalReference:
          "APPROVAL-001",
      },
    );

  assert.equal(
    approved.applicable,
    false,
  );

  assert.equal(
    approved.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .PRIOR_APPROVAL_REQUIRED,
  );

  assert.equal(
    approved.approvalRequired,
    true,
  );

  assert.equal(
    approved.approvalAuthority,
    "French-Ward Administration",
  );

  console.log(
    "✓ opaque approval reference cannot satisfy verified prior approval",
  );

  const monetary =
    await evaluate(
      {
        monetaryLimit:
          "USD 100000",
      },
      {
        monetaryContext: {
          amount:
            "50000",

          currency:
            "USD",
        },
      },
    );

  assert.equal(
    monetary.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .MONETARY_LIMIT_REQUIRES_EVALUATION,
  );

  assert.equal(
    monetary.monetaryEvaluationDeferred,
    true,
  );

  console.log(
    "✓ monetary semantics remain deliberately deferred",
  );

  const suspended =
    await evaluate(
      {},
      {},
      {
        standing:
          REPRESENTATIVE_PROGRAM_STANDING
            .SUSPENDED,
      },
    );

  assert.equal(
    suspended.reason,
    REPRESENTATIVE_AUTHORITY_APPLICABILITY_REASON
      .AUTHORITY_NOT_EXERCISABLE,
  );

  assert.equal(
    suspended.exercisabilityReason,
    REPRESENTATIVE_AUTHORITY_EXERCISABILITY_REASON
      .PARTICIPANT_SUSPENDED,
  );

  console.log(
    "✓ lifecycle ineligibility remains owned by exercisability resolver",
  );

  console.log();
  console.log(
    "CUP-SHARE-1A.1 authority applicability smoke passed",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
