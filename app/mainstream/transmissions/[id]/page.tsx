import { notFound } from "next/navigation";
import styles from "./TransmissionPage.module.css";
import { transmissions } from "@/lib/mainstream/transmissions";
import InstitutionHeader from "@/components/mainstream/InstitutionHeader";

export default function TransmissionPage({
  params,
}: {
  params: { id: string };
}) {
  const transmission = transmissions.find(
    (t) => t.id === params.id
  );

  if (!transmission) return notFound();

  const isLive = transmission.status === "live";

  return (
    <div className={styles.wrapper}>

      <InstitutionHeader status={transmission.status} />

      <div className={styles.controlLayout}>

        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>

          <div className={styles.videoFrame}>
            <video
              className={styles.videoPlayer}
              src={transmission.video}
              autoPlay={isLive}
              muted={isLive}
              loop={!isLive}
              controls
              playsInline
              preload="metadata"
            />
          </div>

          <div className={styles.recordBlock}>
            <p className="ms-registry">{transmission.registry}</p>

            <h1 className={styles.title}>
              {transmission.title}
            </h1>

            <div className={styles.metaRow}>
              <span>Location — {transmission.location}</span>
              <span>Date — {transmission.date}</span>
              <span>Status — {transmission.status}</span>
            </div>

            <p className={styles.abstract}>
              {transmission.abstract}
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <aside className={styles.sidePanel}>
          {isLive ? (
            <div className={styles.chatPanel}>
              <h3 className={styles.panelTitle}>Live Transmission</h3>
              <div className={styles.panelBody}>
                <p>No messages yet.</p>
              </div>
            </div>
          ) : (
            <div className={styles.timelinePanel}>
              <h3 className={styles.panelTitle}>Transmission Timeline</h3>
              <div className={styles.panelBody}>
                <ul>
                  <li>00:00 — Opening Ceremony</li>
                  <li>02:34 — Community Gathering</li>
                  <li>05:10 — Field Movement</li>
                </ul>
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}