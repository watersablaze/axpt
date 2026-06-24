import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/db/prisma";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { promoteTransactionIntakeToOpportunity } from "@/domains/control-center/transaction-intakes/promoteTransactionIntakeToOpportunity";
import {
  TRANSACTION_INTAKE_STATUSES,
  getTransactionIntakeStatusLabel,
  getTransactionIntakeStatusTone,
  isTransactionIntakeStatus,
} from "@/domains/control-center/transaction-intakes/intakeStatuses";

async function updateIntakeReview(formData: FormData) {
  "use server";

  const id = formData.get("id");
  const status = formData.get("status");
  const internalNotes = formData.get("internalNotes");

  if (typeof id !== "string") {
    return;
  }

  const data: {
    status?: string;
    internalNotes?: string | null;
  } = {};

  if (typeof status === "string" && isTransactionIntakeStatus(status)) {
    data.status = status;
  }

  if (typeof internalNotes === "string") {
    data.internalNotes =
      internalNotes.trim().length > 0 ? internalNotes.trim() : null;
  }

  if (Object.keys(data).length === 0) {
    return;
  }

  const existing = await prisma.transactionIntake.findUnique({
    where: { id },
    select: {
      status: true,
      internalNotes: true,
    },
  });

  if (!existing) {
    return;
  }

  const events = [];

  if (data.status && data.status !== existing.status) {
    events.push(
      prisma.transactionIntakeEvent.create({
        data: {
          intakeId: id,
          eventType: "STATUS_CHANGED",
          fromStatus: existing.status,
          toStatus: data.status,
          actor: "ADMIN",
          note:
            typeof internalNotes === "string"
              ? internalNotes.trim() || null
              : null,
        },
      }),
    );
  }

  if (
    typeof data.internalNotes !== "undefined" &&
    data.internalNotes !== existing.internalNotes
  ) {
    events.push(
      prisma.transactionIntakeEvent.create({
        data: {
          intakeId: id,
          eventType: "INTERNAL_NOTE_UPDATED",
          actor: "ADMIN",
          note: data.internalNotes,
        },
      }),
    );
  }

  await prisma.$transaction([
    prisma.transactionIntake.update({
      where: { id },
      data,
    }),
    ...events,
  ]);

  revalidatePath("/admin/transaction-intakes");
  revalidatePath(`/admin/transaction-intakes/${id}`);
}

async function promoteIntakeToOpportunity(formData: FormData) {
  "use server";

  const id = formData.get("id");

  if (typeof id !== "string") {
    return;
  }

  const principal = await getPrincipal();

  await promoteTransactionIntakeToOpportunity({
    intakeId: id,
    actorEmail: principal?.email ?? "ADMIN",
  });

  revalidatePath("/admin/transaction-intakes");
  revalidatePath(`/admin/transaction-intakes/${id}`);
  revalidatePath("/admin/control-center");
}

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | boolean | Date | null | undefined;
}) {
  let displayValue: string;

  if (value instanceof Date) {
    displayValue = value.toLocaleString();
  } else if (typeof value === "boolean") {
    displayValue = value ? "Yes" : "No";
  } else {
    displayValue = value || "—";
  }

  return (
    <div className="rounded border border-gray-800 bg-gray-950 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-gray-100">{displayValue}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export default async function TransactionIntakeDetailPage({ params }: Props) {
  const { id } = await params;

  const intake = await prisma.transactionIntake.findUnique({
    where: { id },
    include: {
      promotedOpportunity: {
        select: {
          id: true,
          title: true,
          status: true,
          source: true,
          createdAt: true,
        },
      },
      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!intake) {
    notFound();
  }

  const canPromoteToOpportunity =
    intake.status === "QUALIFIED" && !intake.promotedOpportunityId;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/transaction-intakes"
          className="text-sm text-blue-300 hover:text-blue-200"
        >
          ← Back to transaction intakes
        </Link>

        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-gray-400">
          Transaction Intake
        </p>
        <h1 className="mt-2 text-3xl font-bold">{intake.reference}</h1>
        <p className="mt-2 text-gray-300">
          Status: {getTransactionIntakeStatusLabel(intake.status)}
        </p>
        <div className="mt-4">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-sm ${getTransactionIntakeStatusTone(
              intake.status,
            )}`}
          >
            {getTransactionIntakeStatusLabel(intake.status)}
          </span>
        </div>

        <section className="mt-8 rounded border border-gray-800 bg-gray-950 p-6">
          <h2 className="text-xl font-semibold">Review Management</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Update the intake status and record internal review notes. These
            notes are visible only on the admin surface.
          </p>

          <form action={updateIntakeReview} className="mt-5 grid gap-4">
            <input type="hidden" name="id" value={intake.id} />

            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Status
              </span>
              <select
                name="status"
                defaultValue={intake.status}
                className="max-w-md rounded border border-gray-700 bg-black px-3 py-2 text-white"
              >
                {TRANSACTION_INTAKE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getTransactionIntakeStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                Internal Notes
              </span>
              <textarea
                name="internalNotes"
                defaultValue={intake.internalNotes || ""}
                rows={6}
                className="w-full rounded border border-gray-700 bg-black px-3 py-2 text-white"
                placeholder="Add review notes, follow-up requirements, risk observations, document needs, or intermediary context..."
              />
            </label>

            <button
              type="submit"
              className="w-fit rounded border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              Save Review Update
            </button>
          </form>

          <div className="mt-6 rounded border border-gray-800 bg-black p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-100">
                  Opportunity Promotion
                </h3>

                <p className="mt-2 max-w-2xl text-sm text-gray-400">
                  Promote a qualified transaction intake into the Control Center
                  opportunity pipeline. This creates a tracked opportunity
                  record and preserves the intake as the source record.
                </p>

                {intake.promotedOpportunity ? (
                  <div className="mt-4 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    <p className="font-semibold">Promoted Opportunity</p>

                    <p className="mt-1">{intake.promotedOpportunity.title}</p>

                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-300/70">
                      {intake.promotedOpportunity.status} ·{" "}
                      {intake.promotedOpportunity.source}
                    </p>

                    <Link
                      href={`/admin/control-center?opportunityId=${intake.promotedOpportunity.id}`}
                      className="mt-3 inline-flex rounded border border-emerald-500/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 hover:bg-emerald-500/10"
                    >
                      Open Promoted Opportunity
                    </Link>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">
                    Promotion is available once the intake status is Qualified.
                  </p>
                )}
              </div>

              {!intake.promotedOpportunity ? (
                <form action={promoteIntakeToOpportunity}>
                  <input type="hidden" name="id" value={intake.id} />

                  <button
                    type="submit"
                    disabled={!canPromoteToOpportunity}
                    className="rounded border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-950 disabled:text-gray-600"
                  >
                    Promote to Opportunity
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded border border-gray-800 bg-gray-950 p-6">
        <h2 className="text-xl font-semibold">Review History</h2>

        {intake.events.length === 0 ? (
          <p className="mt-4 text-gray-400">No review events recorded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {intake.events.map((event) => (
              <div
                key={event.id}
                className="rounded border border-gray-800 bg-black p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-gray-100">
                    {event.eventType}
                  </p>
                  <p className="text-sm text-gray-500">
                    {event.createdAt.toLocaleString()}
                  </p>
                </div>

                {(event.fromStatus || event.toStatus) && (
                  <p className="mt-2 text-sm text-gray-300">
                    {event.fromStatus
                      ? getTransactionIntakeStatusLabel(event.fromStatus)
                      : "—"}{" "}
                    →{" "}
                    {event.toStatus
                      ? getTransactionIntakeStatusLabel(event.toStatus)
                      : "—"}
                  </p>
                )}

                {event.actor && (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-500">
                    Actor: {event.actor}
                  </p>
                )}

                {event.note && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300">
                    {event.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Section title="Buyer / Submitter">
        <Field label="Submitter Name" value={intake.submitterName} />
        <Field label="Submitter Email" value={intake.submitterEmail} />
        <Field label="Phone / WhatsApp" value={intake.submitterPhone} />
        <Field label="Submitter Company" value={intake.submitterCompany} />
        <Field label="Country / Jurisdiction" value={intake.submitterCountry} />
        <Field label="Submitter Role" value={intake.submitterRole} />
        <Field label="Buyer Company / Party" value={intake.buyerName} />
        <Field
          label="Authorization Status"
          value={intake.authorizationStatus}
        />
      </Section>

      <Section title="Representation">
        <Field
          label="Represented Party Type"
          value={intake.representedPartyType}
        />
        <Field
          label="Represented Party Name"
          value={intake.representedPartyName}
        />
      </Section>

      <Section title="Transaction Structure">
        <Field label="Program" value={intake.program} />
        <Field label="Transaction Structure" value={intake.transactionType} />
        <Field label="Delivery Terms" value={intake.deliveryTerms} />
        <Field label="Settlement Method" value={intake.settlementMethod} />
        <Field label="Expected Timeline" value={intake.expectedTimeline} />
      </Section>

      <Section title="Commodity Request">
        <Field label="Commodity" value={intake.commodity} />
        <Field label="Total Quantity" value={intake.quantity} />
        <Field label="Trial Quantity" value={intake.trialQuantity} />
        <Field label="Monthly Quantity" value={intake.monthlyQuantity} />
        <Field label="Origin" value={intake.origin} />
        <Field label="Destination" value={intake.destination} />
      </Section>

      <Section title="Readiness Status">
        <Field label="Financial Readiness" value={intake.financialReadiness} />
        <Field label="Readiness Materials" value={intake.documentsAvailable} />
        <Field label="Additional Notes" value={intake.supportingNotes} />
      </Section>

      <Section title="Representative / Referral">
        <Field label="Referral Code" value={intake.referralCode} />
        <Field label="Issuing Representative" value={intake.referredByName} />
        <Field
          label="Representative Company"
          value={intake.referredByCompany}
        />
        <Field label="Representative Email" value={intake.referredByEmail} />
        <Field label="Representative Role" value={intake.referredByRole} />
      </Section>

      <Section title="Submission Notices">
        <Field label="Accuracy Confirmed" value={intake.declarationAccuracy} />
        <Field
          label="No Obligation Confirmed"
          value={intake.declarationNoObligation}
        />
        <Field
          label="No Commission / Mandate Right Confirmed"
          value={intake.declarationNoCommission}
        />
      </Section>

      <Section title="System Metadata">
        <Field label="Source URL" value={intake.sourceUrl} />
        <Field label="IP Address" value={intake.ipAddress} />
        <Field label="User Agent" value={intake.userAgent} />
        <Field label="Created At" value={intake.createdAt} />
        <Field label="Updated At" value={intake.updatedAt} />
      </Section>
    </main>
  );
}
