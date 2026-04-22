import styles from "./ChannelDirectory.module.css";
import { mainstreamChannels } from "@/lib/mainstream/transmissions";

export default function ChannelDirectory() {
  return (
    <section className="ms-section channels">
      <div className="ms-container">
        <h3>Channel Directory</h3>

        <div className={styles.grid}>
          {mainstreamChannels.map((channel) => (
            <div key={channel.slug} className={`ms-card ${styles.card}`}>
              <h4>{channel.name}</h4>
              <p>{channel.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
