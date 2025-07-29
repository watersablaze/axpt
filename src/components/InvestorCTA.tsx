// components/InvestorCTA.tsx
import styles from './InvestorCTA.module.css';
import Link from 'next/link';

export default function InvestorCTA() {
  return (
    <section className={styles.cta}>
      <h3>Next Steps</h3>
      <p>Would you like to connect with our strategist or explore an active opportunity?</p>
      <div className={styles.buttons}>
        <a href="https://calendly.com/your-link" target="_blank" className={styles.primary}>📅 Schedule a Call</a>
        <Link href="/projects/first-national-supermarket" className={styles.secondary}>
          🛒 View Project
        </Link>
      </div>
    </section>
  );
}