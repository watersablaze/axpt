import styles from './GemBackdrop.module.css';

export default function GemBackdrop() {
  return (
    <div className={styles.gemLayer}>
      <img
        src="/images/gems/emerald.png"
        alt="Emerald Glow"
        className={styles.gemImage}
      />
      <div className={styles.gemGlow} />
    </div>
  );
}