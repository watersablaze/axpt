import TransactionIntakeForm from "./TransactionIntakeForm";
import styles from "./transaction-intake.module.css";

type Props = {
  searchParams?: Promise<{
    ref?: string;
    rep?: string;
    program?: string;
  }>;
};

export default async function TransactionIntakePage({ searchParams }: Props) {
  const params = await searchParams;
  const referralCode = params?.ref || "";
  const representativeName = params?.rep || "";
  const program = params?.program || "";

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>AXPT / French-Ward Intake</p>
        <h1>Transaction Intake</h1>
        <p>
          Submit a proposed commodity transaction for preliminary commercial
          review. Qualified submissions may be routed into AXPT / French-Ward
          review before any Opportunity, Dossier, or transaction document is
          prepared.
        </p>

        <div className={styles.notice}>
          Submission of this form is for review intake only and does not
          constitute acceptance, approval, allocation, contract formation,
          mandate creation, commission recognition, agency authorization, or
          issuance permission by AXPT, French-Ward International, or any
          associated party.
        </div>
      </section>

      <TransactionIntakeForm
        initialReferralCode={referralCode}
        initialRepresentativeName={representativeName}
        initialProgram={program}
      />
    </main>
  );
}
