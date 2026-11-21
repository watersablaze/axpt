import styles from "./cup-reading.module.css";
export default function CupReaderStatus({ error, retry }: { error?: string; retry?: () => void }) {
  return <div className={styles.loadingPanel}>
    {error ? <p role="alert">{error}</p> : <>
      <span className={styles.loadingRule} aria-hidden="true" />
      <p role="status">Opening document</p>
      <small>Your workspace remains available while this material opens.</small>
    </>}
    {retry ? <button type="button" onClick={retry} className={styles.readerRetry}>Try again</button> : null}
  </div>;
}
