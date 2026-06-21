'use client'

type Instrument = {
  id: string
  type: string
  status: string
  version: string
  title: string
}

type Props = {
  instruments: Instrument[]
}

type RequiredDocument = {
  key: string
  label: string
  description: string
  instrumentType?: string
  requiredFor: string
}

type DocumentGroup = {
  title: string
  description: string
  documents: RequiredDocument[]
}

const DOCUMENT_GROUPS: DocumentGroup[] = [
  {
    title: 'Buyer / Representative',
    description:
      'Identity, authority, and funds evidence required before serious execution.',
    documents: [
      {
        key: 'BUYER_CIS',
        label: 'Buyer CIS',
        description:
          'Corporate information sheet or buyer profile identifying the purchasing entity.',
        requiredFor: 'KYC Review',
      },
      {
        key: 'BUYER_POF',
        label: 'Proof of Funds',
        description:
          'Bank comfort, statement, attestation, or acceptable funds evidence.',
        requiredFor: 'Commercial Qualification',
      },
      {
        key: 'BUYER_AUTHORIZATION',
        label: 'Authorization / Mandate',
        description:
          'Written authorization confirming the submitter or representative may act for the buyer.',
        requiredFor: 'KYC Review',
      },
      {
        key: 'BUYER_ID',
        label: 'Passport / ID',
        description:
          'Identity document for authorized representative or beneficial control contact.',
        requiredFor: 'KYC Review',
      },
      {
        key: 'BUYER_BANKING',
        label: 'Buyer Banking Coordinates',
        description:
          'Settlement bank details or confirmation of expected settlement path.',
        instrumentType: 'ANNEX_B_SETTLEMENT',
        requiredFor: 'Settlement Readiness',
      },
    ],
  },
  {
    title: 'Seller / Source',
    description:
      'Seller-side documents needed to establish identity, authority, banking, and product context.',
    documents: [
      {
        key: 'SELLER_KYC',
        label: 'Seller KYC / Passport',
        description:
          'Seller identity package, passport, corporate profile, or cooperative authority evidence.',
        instrumentType: 'ANNEX_D_COMPLIANCE',
        requiredFor: 'Compliance Review',
      },
      {
        key: 'SELLER_BANKING',
        label: 'Seller Banking Coordinates',
        description:
          'Seller-side settlement or receiving bank details.',
        instrumentType: 'ANNEX_B_SETTLEMENT',
        requiredFor: 'Settlement Readiness',
      },
      {
        key: 'PRODUCT_EVIDENCE',
        label: 'Product / Origin Evidence',
        description:
          'Available origin notes, assay context, cooperative statement, or product evidence.',
        requiredFor: 'Commercial Readiness',
      },
    ],
  },
  {
    title: 'Transaction Package',
    description:
      'Core transaction instruments used to move from qualified opportunity to executable dossier.',
    documents: [
      {
        key: 'SPA',
        label: 'SPA',
        description:
          'Sale and purchase agreement package for the transaction.',
        instrumentType: 'SPA',
        requiredFor: 'SPA Drafting',
      },
      {
        key: 'ANNEX_A_DELIVERY',
        label: 'Annex A · Delivery',
        description:
          'Delivery terms, transaction route, and movement responsibilities.',
        instrumentType: 'ANNEX_A_DELIVERY',
        requiredFor: 'SPA Package',
      },
      {
        key: 'ANNEX_B_SETTLEMENT',
        label: 'Annex B · Settlement',
        description:
          'Banking, payment, escrow, or settlement pathway terms.',
        instrumentType: 'ANNEX_B_SETTLEMENT',
        requiredFor: 'Settlement Readiness',
      },
      {
        key: 'ANNEX_C_REFINERY',
        label: 'Annex C · Refinery',
        description:
          'Refinery coordination, assay, intake, and processing expectations.',
        instrumentType: 'ANNEX_C_REFINERY',
        requiredFor: 'Refinery Coordination',
      },
      {
        key: 'ANNEX_D_COMPLIANCE',
        label: 'Annex D · Compliance',
        description:
          'KYC, identity, authorization, and commercial compliance package.',
        instrumentType: 'ANNEX_D_COMPLIANCE',
        requiredFor: 'Compliance Review',
      },
      {
        key: 'ANNEX_E_PROCEDURE',
        label: 'Annex E · Execution Framework',
        description:
          'Step-by-step transaction execution procedure and release framework.',
        instrumentType: 'ANNEX_E_PROCEDURE',
        requiredFor: 'Execution Readiness',
      },
    ],
  },
  {
    title: 'Export / Execution',
    description:
      'Notices and instruments used once the dossier moves from commercial readiness into movement.',
    documents: [
      {
        key: 'EXPORT_RELEASE_NOTICE',
        label: 'Export Release Notice',
        description:
          'Notice confirming export release conditions are satisfied.',
        instrumentType: 'EXPORT_RELEASE_NOTICE',
        requiredFor: 'Export Release',
      },
      {
        key: 'EXPORT_ACTIVATION_NOTICE',
        label: 'Export Activation Notice',
        description:
          'Notice confirming export activation and operational movement.',
        instrumentType: 'EXPORT_ACTIVATION_NOTICE',
        requiredFor: 'Export Active',
      },
    ],
  },
]

function statusTone(status: string) {
  switch (status) {
    case 'EXECUTED':
      return 'border-emerald-900 bg-emerald-950/20 text-emerald-300'

    case 'ACTIVE':
      return 'border-cyan-900 bg-cyan-950/20 text-cyan-300'

    case 'DRAFT':
      return 'border-amber-900 bg-amber-950/20 text-amber-300'

    case 'TEMPLATE':
      return 'border-neutral-700 bg-black/30 text-neutral-300'

    case 'SUPERSEDED':
    case 'ARCHIVED':
      return 'border-neutral-800 bg-black/30 text-neutral-500'

    case 'MISSING':
    default:
      return 'border-red-900 bg-red-950/20 text-red-300'
  }
}

function getDocumentStatus(
  document: RequiredDocument,
  instruments: Instrument[]
) {
  if (!document.instrumentType) {
    return {
      label: 'Pending',
      tone: statusTone('MISSING'),
      instrument: null,
    }
  }

  const instrument = instruments.find(
    (item) => item.type === document.instrumentType
  )

  if (!instrument) {
    return {
      label: 'Missing',
      tone: statusTone('MISSING'),
      instrument: null,
    }
  }

  return {
    label: instrument.status,
    tone: statusTone(instrument.status),
    instrument,
  }
}

function getSummary(instruments: Instrument[]) {
  const requiredDocuments = DOCUMENT_GROUPS.flatMap(
    (group) => group.documents
  )

  return requiredDocuments.reduce(
    (summary, document) => {
      const status = getDocumentStatus(document, instruments)

      if (
        status.label === 'EXECUTED' ||
        status.label === 'ACTIVE'
      ) {
        summary.ready += 1
      } else if (status.label === 'DRAFT') {
        summary.draft += 1
      } else {
        summary.pending += 1
      }

      return summary
    },
    {
      ready: 0,
      draft: 0,
      pending: 0,
      total: requiredDocuments.length,
    }
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber' | 'red' | 'neutral'
}) {
  const toneClass = {
    emerald:
      'border-emerald-900 bg-emerald-950/20 text-emerald-300',
    amber:
      'border-amber-900 bg-amber-950/20 text-amber-300',
    red: 'border-red-900 bg-red-950/20 text-red-300',
    neutral:
      'border-neutral-800 bg-black/30 text-neutral-400',
  }[tone]

  return (
    <div
      className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${toneClass}`}
    >
      {value} {label}
    </div>
  )
}

export default function DossierDocumentsPanel({
  instruments,
}: Props) {
  const summary = getSummary(instruments)

  return (
    <div className="rounded-xl border border-neutral-800 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
            Documents
          </div>

          <h3 className="mt-1 text-sm font-medium text-white">
            Document Readiness Matrix
          </h3>

          <p className="mt-1 max-w-2xl text-xs text-neutral-500">
            Track required buyer, seller, transaction, and execution documents
            before advancing the dossier.
          </p>
        </div>

        <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-400">
          {instruments.length} Instruments
        </div>
      </div>

      <div className="mt-3 rounded border border-neutral-800 bg-black/30 p-3">
        <div className="text-[10px] uppercase tracking-wide text-neutral-600">
          Package Readiness
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <SummaryPill
            label="Ready"
            value={summary.ready}
            tone="emerald"
          />
          <SummaryPill
            label="Draft"
            value={summary.draft}
            tone="amber"
          />
          <SummaryPill
            label="Pending"
            value={summary.pending}
            tone="red"
          />
          <SummaryPill
            label="Required"
            value={summary.total}
            tone="neutral"
          />
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {DOCUMENT_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded border border-neutral-800 bg-black/30 p-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
                  {group.title}
                </h4>

                <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-neutral-500">
                  {group.description}
                </p>
              </div>

              <div className="rounded border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">
                {group.documents.length} Items
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {group.documents.map((document) => {
                const status = getDocumentStatus(
                  document,
                  instruments
                )

                return (
                  <div
                    key={document.key}
                    className="rounded border border-neutral-800 bg-black/30 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-white">
                          {status.instrument?.title ??
                            document.label}
                        </div>

                        <div className="mt-1 text-[10px] uppercase tracking-wide text-neutral-600">
                          {document.instrumentType ??
                            'OPERATIONAL_REQUIREMENT'}
                          {status.instrument
                            ? ` · ${status.instrument.version}`
                            : ''}
                          {' · '}
                          {document.requiredFor}
                        </div>

                        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-neutral-500">
                          {document.description}
                        </p>
                      </div>

                      <div
                        className={`rounded border px-2 py-1 text-[10px] uppercase tracking-wide ${status.tone}`}
                      >
                        {status.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
