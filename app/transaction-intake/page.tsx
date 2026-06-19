import TransactionIntakeForm from './TransactionIntakeForm'
import styles from './transaction-intake.module.css'

type Props = {
  searchParams?: Promise<{
    ref?: string
    program?: string
  }>
}

export default async function TransactionIntakePage({ searchParams }: Props) {
  const params = await searchParams
  const referralCode = params?.ref || ''
  const program = params?.program || ''

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>AXPT Transaction Intake</p>
        <h1>Submit a transaction interest record for review.</h1>
        <p>
          This portal captures the submitting party, transaction structure,
          represented parties, and any intermediary or referral association.
        </p>

        <div className={styles.notice}>
          Submission of this form does not create a contract, offer,
          allocation, mandate, commission right, agency relationship, or
          obligation by AXPT, French-Ward International, or any associated party.
        </div>
      </section>

      <TransactionIntakeForm
        initialReferralCode={referralCode}
        initialProgram={program}
      />
    </main>
  )
}
