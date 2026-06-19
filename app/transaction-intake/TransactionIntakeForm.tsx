'use client'

import { FormEvent, useMemo, useState } from 'react'
import styles from './transaction-intake.module.css'

type Props = {
  initialReferralCode?: string
  initialProgram?: string
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; reference: string }
  | { status: 'error'; message: string }

const roleOptions = [
  'Buyer',
  'Seller',
  'Buyer Mandate',
  'Seller Mandate',
  'Intermediary',
  'Representative',
  'Consultant',
  'Refinery Contact',
  'Logistics Contact',
  'Other',
]

const authorizationOptions = [
  'Principal',
  'Written authorization available',
  'Authorization pending',
  'Introduction only',
  'Unknown',
]

const programOptions = [
  'French-Ward Gold',
  'Bafoula Cooperative',
  'AXPT Strategic Intake',
  'General',
  'Other',
]

const transactionTypeOptions = [
  'FOB',
  'CIF',
  'Cash & Carry',
  'Refinery Settlement',
  'Escrow Settlement',
  'Hand-carry Export',
  'Other',
]

function inputValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export default function TransactionIntakeForm({
  initialReferralCode = '',
  initialProgram = '',
}: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })

  const sourceUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      submitterName: inputValue(formData, 'submitterName'),
      submitterEmail: inputValue(formData, 'submitterEmail'),
      submitterPhone: inputValue(formData, 'submitterPhone'),
      submitterCompany: inputValue(formData, 'submitterCompany'),
      submitterCountry: inputValue(formData, 'submitterCountry'),

      submitterRole: inputValue(formData, 'submitterRole'),
      representedPartyType: inputValue(formData, 'representedPartyType'),
      representedPartyName: inputValue(formData, 'representedPartyName'),
      authorizationStatus: inputValue(formData, 'authorizationStatus'),

      program: inputValue(formData, 'program'),
      transactionType: inputValue(formData, 'transactionType'),
      commodity: inputValue(formData, 'commodity'),
      quantity: inputValue(formData, 'quantity'),
      trialQuantity: inputValue(formData, 'trialQuantity'),
      monthlyQuantity: inputValue(formData, 'monthlyQuantity'),
      origin: inputValue(formData, 'origin'),
      destination: inputValue(formData, 'destination'),
      deliveryTerms: inputValue(formData, 'deliveryTerms'),
      settlementMethod: inputValue(formData, 'settlementMethod'),
      expectedTimeline: inputValue(formData, 'expectedTimeline'),

      buyerName: inputValue(formData, 'buyerName'),
      sellerName: inputValue(formData, 'sellerName'),
      refineryPreference: inputValue(formData, 'refineryPreference'),
      financialReadiness: inputValue(formData, 'financialReadiness'),
      documentsAvailable: inputValue(formData, 'documentsAvailable'),
      supportingNotes: inputValue(formData, 'supportingNotes'),

      referralCode: inputValue(formData, 'referralCode'),
      referredByName: inputValue(formData, 'referredByName'),
      referredByCompany: inputValue(formData, 'referredByCompany'),
      referredByEmail: inputValue(formData, 'referredByEmail'),
      referredByPhone: inputValue(formData, 'referredByPhone'),
      referredByRole: inputValue(formData, 'referredByRole'),
      referralConfirmed: formData.get('referralConfirmed') === 'on',
      compensationExpectation: inputValue(formData, 'compensationExpectation'),

      declarationAccuracy: formData.get('declarationAccuracy') === 'on',
      declarationNoObligation: formData.get('declarationNoObligation') === 'on',
      declarationNoCommission: formData.get('declarationNoCommission') === 'on',

      sourceUrl,
    }

    if (!payload.submitterName || !payload.submitterEmail || !payload.submitterRole) {
      setSubmitState({
        status: 'error',
        message: 'Please provide your name, email, and role.',
      })
      return
    }

    if (
      !payload.declarationAccuracy ||
      !payload.declarationNoObligation ||
      !payload.declarationNoCommission
    ) {
      setSubmitState({
        status: 'error',
        message: 'Please confirm all required declarations before submitting.',
      })
      return
    }

    setSubmitState({ status: 'submitting' })

    try {
      const response = await fetch('/api/transaction-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        setSubmitState({
          status: 'error',
          message: data.error || 'Unable to submit transaction intake.',
        })
        return
      }

      setSubmitState({
        status: 'success',
        reference: data.intake.reference,
      })

      form.reset()
    } catch {
      setSubmitState({
        status: 'error',
        message: 'Unable to submit transaction intake.',
      })
    }
  }

  if (submitState.status === 'success') {
    return (
      <section className={styles.successCard}>
        <p className={styles.kicker}>Submission Received</p>
        <h2>Your transaction intake has been submitted.</h2>
        <p>Please retain this reference for future communication:</p>
        <div className={styles.reference}>{submitState.reference}</div>
        <p className={styles.muted}>
          Status: Submitted for Review. This does not constitute acceptance,
          approval, allocation, or contract formation.
        </p>
      </section>
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <section className={styles.section}>
        <h2>Submitting Party</h2>
        <div className={styles.grid}>
          <label>
            Full legal name *
            <input name="submitterName" required />
          </label>
          <label>
            Email *
            <input name="submitterEmail" type="email" required />
          </label>
          <label>
            Phone / WhatsApp
            <input name="submitterPhone" />
          </label>
          <label>
            Company / Organization
            <input name="submitterCompany" />
          </label>
          <label>
            Country
            <input name="submitterCountry" />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Role & Representation</h2>
        <div className={styles.grid}>
          <label>
            Submitter role *
            <select name="submitterRole" required defaultValue="">
              <option value="" disabled>Select role</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>

          <label>
            Represented party type
            <input name="representedPartyType" placeholder="Buyer, seller, mandate, entity..." />
          </label>

          <label>
            Represented party name
            <input name="representedPartyName" />
          </label>

          <label>
            Authorization status
            <select name="authorizationStatus" defaultValue="">
              <option value="">Select status</option>
              {authorizationOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Transaction Details</h2>
        <div className={styles.grid}>
          <label>
            Program
            <select name="program" defaultValue={initialProgram}>
              <option value="">Select program</option>
              {programOptions.map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </label>

          <label>
            Transaction type
            <select name="transactionType" defaultValue="">
              <option value="">Select type</option>
              {transactionTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label>
            Commodity
            <input name="commodity" placeholder="Gold, agriculture, energy..." />
          </label>

          <label>
            Quantity
            <input name="quantity" placeholder="Example: 5 KG" />
          </label>

          <label>
            Trial quantity
            <input name="trialQuantity" />
          </label>

          <label>
            Monthly quantity
            <input name="monthlyQuantity" />
          </label>

          <label>
            Origin
            <input name="origin" />
          </label>

          <label>
            Destination
            <input name="destination" />
          </label>

          <label>
            Delivery terms
            <input name="deliveryTerms" placeholder="FOB, CIF, hand-carry..." />
          </label>

          <label>
            Settlement method
            <input name="settlementMethod" placeholder="Cash, MT103, DLC, escrow..." />
          </label>

          <label>
            Expected timeline
            <input name="expectedTimeline" />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Commercial Readiness</h2>
        <div className={styles.grid}>
          <label>
            Buyer name
            <input name="buyerName" />
          </label>
          <label>
            Seller name
            <input name="sellerName" />
          </label>
          <label>
            Refinery preference
            <input name="refineryPreference" />
          </label>
          <label>
            Financial readiness
            <input name="financialReadiness" placeholder="POF, MT103, DLC, SBLC..." />
          </label>
          <label className={styles.wide}>
            Documents available
            <textarea name="documentsAvailable" rows={4} placeholder="LOI, CIS, POF, passport/ID, mandate letter, bank readiness letter..." />
          </label>
          <label className={styles.wide}>
            Supporting notes
            <textarea name="supportingNotes" rows={4} />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Referral / Intermediary Attribution</h2>
        <div className={styles.grid}>
          <label>
            Referral code
            <input name="referralCode" defaultValue={initialReferralCode} />
          </label>
          <label>
            Referred by name
            <input name="referredByName" />
          </label>
          <label>
            Referred by company
            <input name="referredByCompany" />
          </label>
          <label>
            Referred by email
            <input name="referredByEmail" type="email" />
          </label>
          <label>
            Referred by phone
            <input name="referredByPhone" />
          </label>
          <label>
            Referred by role
            <input name="referredByRole" placeholder="Introducer, mandate, consultant..." />
          </label>
          <label className={styles.wide}>
            Known compensation expectation
            <textarea name="compensationExpectation" rows={3} />
          </label>
        </div>

        <label className={styles.checkbox}>
          <input name="referralConfirmed" type="checkbox" />
          I confirm this referral association is accurate to the best of my knowledge.
        </label>
      </section>

      <section className={styles.section}>
        <h2>Declarations</h2>

        <label className={styles.checkbox}>
          <input name="declarationAccuracy" type="checkbox" required />
          I confirm the information provided is accurate to the best of my knowledge and that I am authorized to submit it or have clearly identified myself as an introducer only.
        </label>

        <label className={styles.checkbox}>
          <input name="declarationNoObligation" type="checkbox" required />
          I understand this submission does not create a contract, offer, allocation, agency relationship, or obligation by AXPT, French-Ward International, or any associated party.
        </label>

        <label className={styles.checkbox}>
          <input name="declarationNoCommission" type="checkbox" required />
          I understand that identifying an intermediary or referral source does not create, confirm, or guarantee commission, mandate status, or compensation rights.
        </label>
      </section>

      {submitState.status === 'error' && (
        <div className={styles.error}>{submitState.message}</div>
      )}

      <button
        className={styles.submit}
        type="submit"
        disabled={submitState.status === 'submitting'}
      >
        {submitState.status === 'submitting'
          ? 'Submitting...'
          : 'Submit Transaction Intake'}
      </button>
    </form>
  )
}
