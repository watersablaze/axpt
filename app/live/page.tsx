import Image from 'next/image';
import styles from './live.module.css';

export default function LivePage() {
  return (
    <main className={styles.container}>
      
      {/* Poster */}
      <div className={styles.posterWrapper}>
        <Image
          src="/live/matriarch-monday.png"
          alt="Matriarch Monday"
          width={900}
          height={900}
          className={styles.poster}
          priority
        />
      </div>

      {/* Minimal Title Block */}
      <section className={styles.titleBlock}>
        <h1>Matriarch Monday: Warriors in the Garden</h1>
        <p className={styles.subtitle}>
          Intergenerational strategy between Florida and Cape Town.
        </p>
      </section>

    </main>
  );
}