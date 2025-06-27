// components/InvestorGreeting.tsx
import styles from './InvestorGreeting.module.css';

interface InvestorGreetingProps {
  name: string;
  tier?: string;
}

export default function InvestorGreeting({ name, tier = 'Investor' }: InvestorGreetingProps) {
  return (
    <section className={styles.greeting}>
      <h2>Welcome, {name}</h2>
      <p>
        You've been granted <strong>{tier}</strong> access.
        <br />
        Thank you for stepping into the AXPT.io ecosystem.
      </p>
      <div className={styles.pulseGlow}></div>
    </section>
  );
}