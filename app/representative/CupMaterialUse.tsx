import styles from "./cup-material-use.module.css";

export default function CupMaterialUse({ id, canPresent, canTransmit, canDownload }: {
  id: string; canPresent: boolean; canTransmit: boolean; canDownload: boolean;
}) {
  const permissions = [
    { label: "Read", status: "Available", tone: "available",
      text: "Review this document inside your workspace." },
    { label: "Present", status: canPresent ? "Authority required" : "Not enabled",
      tone: canPresent ? "conditional" : "withheld",
      text: canPresent
        ? "Show and explain it in a discussion within your recorded authority. This does not give the buyer ongoing access."
        : "For your own review. Permission to show it to another party has not been released." },
    { label: "Share access", status: canTransmit ? "Buyer invitation" : "Not enabled",
      tone: canTransmit ? "conditional" : "withheld",
      text: canTransmit
        ? "Select it in a buyer invitation. The system checks authority and recipient context before granting access. Each buyer signs in with their own email."
        : "Do not send this document or include it in a buyer invitation." },
    { label: "Download", status: canDownload ? "Available" : "Not enabled",
      tone: canDownload ? "available" : "withheld",
      text: canDownload
        ? "Use Download to save a copy. This does not itself permit forwarding or distribution."
        : "Read it here. A separate downloadable copy has not been released." },
  ];
  return <section className={styles.panel} aria-labelledby={`use-posture-${id}`}>
    <div className={styles.heading}>
      <h3 id={`use-posture-${id}`}>Document use</h3>
      <span>Expand an action for guidance</span>
    </div>
    <div className={styles.actions}>
      {permissions.map(permission => <details key={permission.label} className={styles.action}>
        <summary>
          <span className={styles.label}>{permission.label}</span>
          <span className={styles.status} data-tone={permission.tone}>{permission.status}</span>
          <span className={styles.indicator} aria-hidden="true" />
        </summary>
        <p className={styles.explanation}>{permission.text}</p>
      </details>)}
    </div>
    <details className={styles.boundary}>
      <summary>Limits of use <span aria-hidden="true">↗</span></summary>
      <p>Document permission does not authorize a transaction or let you bind French-Ward or change its terms. Your appointment, authority and commercial context must permit the use. If an action is blocked, use Ask French-Ward.</p>
    </details>
  </section>;
}
