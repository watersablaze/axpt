import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound } from 'next/navigation'
import { prisma } from '@/infrastructure/db/prisma'

const INTAKE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'NEEDS_CLARIFICATION',
  'QUALIFIED',
  'DECLINED',
  'DOSSIER_READY',
  'PROMOTED_TO_DOSSIER',
] as const

async function updateIntakeReview(formData: FormData) {
  'use server'

  const id = formData.get('id')
  const status = formData.get('status')
  const internalNotes = formData.get('internalNotes')

  if (typeof id !== 'string') {
    return
  }

  const data: {
    status?: string
    internalNotes?: string | null
  } = {}

  if (
    typeof status === 'string' &&
    INTAKE_STATUSES.includes(status as (typeof INTAKE_STATUSES)[number])
  ) {
    data.status = status
  }

  if (typeof internalNotes === 'string') {
    data.internalNotes = internalNotes.trim().length > 0 ? internalNotes.trim() : null
  }

  if (Object.keys(data).length === 0) {
    return
  }

  const existing = await prisma.transactionIntake.findUnique({
    where: { id },
    select: {
      status: true,
      internalNotes: true,
    },
  })

  if (!existing) {
    return
  }

  const events = []

  if (data.status && data.status !== existing.status) {
    events.push(
      prisma.transactionIntakeEvent.create({
        data: {
          intakeId: id,
          eventType: 'STATUS_CHANGED',
          fromStatus: existing.status,
          toStatus: data.status,
          actor: 'ADMIN',
          note: typeof internalNotes === 'string' ? internalNotes.trim() || null : null,
        },
      }),
    )
  }

  if (
    typeof data.internalNotes !== 'undefined' &&
    data.internalNotes !== existing.internalNotes
  ) {
    events.push(
      prisma.transactionIntakeEvent.create({
        data: {
          intakeId: id,
          eventType: 'INTERNAL_NOTE_UPDATED',
          actor: 'ADMIN',
          note: data.internalNotes,
        },
      }),
    )
  }

  await prisma.$transaction([
    prisma.transactionIntake.update({
      where: { id },
      data,
    }),
    ...events,
  ])

  revalidatePath('/admin/transaction-intakes')
  revalidatePath(`/admin/transaction-intakes/${id}`)
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'border-blue-400/40 bg-blue-400/10 text-blue-200'
    case 'NEEDS_CLARIFICATION':
      return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
    case 'QUALIFIED':
    case 'DOSSIER_READY':
    case 'PROMOTED_TO_DOSSIER':
      return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
    case 'DECLINED':
      return 'border-red-400/40 bg-red-400/10 text-red-200'
    case 'SUBMITTED':
    default:
      return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  }
}

type Props = {
  params: Promise<{
    id: string
  }>
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | boolean | Date | null | undefined
}) {
  let displayValue: string

  if (value instanceof Date) {
    displayValue = value.toLocaleString()
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No'
  } else {
    displayValue = value || '—'
  }

  return (
    <div className="rounded border border-gray-800 bg-gray-950 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-gray-100">{displayValue}</p>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

export default async function TransactionIntakeDetailPage({ params }: Props) {
  const { id } = await params

const intake = await prisma.transactionIntake.findUnique({
  where: { id },
  include: {
    events: {
      orderBy: {
        createdAt: 'desc',
      },
    },
  },
})

  if (!intake) {
    notFound()
  }

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
        <p className="mt-2 text-gray-300">Status: {intake.status}</p>
        <div className="mt-4">
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-sm ${statusBadgeClass(
            intake.status,
            )}`}
        >
            {intake.status}
        </span>
        </div>

        <section className="mt-8 rounded border border-gray-800 bg-gray-950 p-6">
        <h2 className="text-xl font-semibold">Review Management</h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
            Update the intake status and record internal review notes. These notes are
            visible only on the admin surface.
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
                {INTAKE_STATUSES.map((status) => (
                <option key={status} value={status}>
                    {status}
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
                defaultValue={intake.internalNotes || ''}
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
                  <p className="font-semibold text-gray-100">{event.eventType}</p>
                  <p className="text-sm text-gray-500">
                    {event.createdAt.toLocaleString()}
                  </p>
                </div>

                {(event.fromStatus || event.toStatus) && (
                  <p className="mt-2 text-sm text-gray-300">
                    {event.fromStatus || '—'} → {event.toStatus || '—'}
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

      <Section title="Submitter">
        <Field label="Name" value={intake.submitterName} />
        <Field label="Email" value={intake.submitterEmail} />
        <Field label="Phone" value={intake.submitterPhone} />
        <Field label="Company" value={intake.submitterCompany} />
        <Field label="Country" value={intake.submitterCountry} />
        <Field label="Role" value={intake.submitterRole} />
      </Section>

      <Section title="Representation">
        <Field label="Represented Party Type" value={intake.representedPartyType} />
        <Field label="Represented Party Name" value={intake.representedPartyName} />
        <Field label="Authorization Status" value={intake.authorizationStatus} />
      </Section>

      <Section title="Transaction">
        <Field label="Program" value={intake.program} />
        <Field label="Transaction Type" value={intake.transactionType} />
        <Field label="Commodity" value={intake.commodity} />
        <Field label="Quantity" value={intake.quantity} />
        <Field label="Trial Quantity" value={intake.trialQuantity} />
        <Field label="Monthly Quantity" value={intake.monthlyQuantity} />
        <Field label="Origin" value={intake.origin} />
        <Field label="Destination" value={intake.destination} />
        <Field label="Delivery Terms" value={intake.deliveryTerms} />
        <Field label="Settlement Method" value={intake.settlementMethod} />
        <Field label="Expected Timeline" value={intake.expectedTimeline} />
      </Section>

      <Section title="Commercial Readiness">
        <Field label="Buyer Name" value={intake.buyerName} />
        <Field label="Seller Name" value={intake.sellerName} />
        <Field label="Refinery Preference" value={intake.refineryPreference} />
        <Field label="Financial Readiness" value={intake.financialReadiness} />
        <Field label="Documents Available" value={intake.documentsAvailable} />
        <Field label="Supporting Notes" value={intake.supportingNotes} />
      </Section>

      <Section title="Referral / Intermediary">
        <Field label="Referral Code" value={intake.referralCode} />
        <Field label="Referred By Name" value={intake.referredByName} />
        <Field label="Referred By Company" value={intake.referredByCompany} />
        <Field label="Referred By Email" value={intake.referredByEmail} />
        <Field label="Referred By Phone" value={intake.referredByPhone} />
        <Field label="Referred By Role" value={intake.referredByRole} />
        <Field label="Referral Confirmed" value={intake.referralConfirmed} />
        <Field label="Compensation Expectation" value={intake.compensationExpectation} />
      </Section>

      <Section title="Declarations">
        <Field label="Accuracy Confirmed" value={intake.declarationAccuracy} />
        <Field label="No Obligation Confirmed" value={intake.declarationNoObligation} />
        <Field label="No Commission Confirmed" value={intake.declarationNoCommission} />
      </Section>

      <Section title="System Metadata">
        <Field label="Source URL" value={intake.sourceUrl} />
        <Field label="IP Address" value={intake.ipAddress} />
        <Field label="User Agent" value={intake.userAgent} />
        <Field label="Created At" value={intake.createdAt} />
        <Field label="Updated At" value={intake.updatedAt} />
      </Section>
    </main>
  )
}
