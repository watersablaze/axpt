import type { RepresentativeAppointmentClass } from "@prisma/client";

import styles from "./home.module.css";
import registerStyles from "./ArpRegister.module.css";

export type ArpRegisterEntry = {
  id: string;
  appointmentClass: RepresentativeAppointmentClass;
  expiresAt: string | null;
  participant: { displayName: string; docketReference: string };
  instrument: { reference: string };
};

const appointmentLabels: Record<RepresentativeAppointmentClass, string> = {
  REGISTERED_COMMERCIAL_INTRODUCER: "Registered Commercial Introducer",
  AUTHORIZED_COMMERCIAL_REPRESENTATIVE: "Authorized Commercial Representative",
  TRANSACTION_REPRESENTATIVE: "Transaction Representative",
  COMMERCIAL_MANDATE: "Commercial Mandate",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function ArpRegister({
  appointments,
}: {
  appointments: readonly ArpRegisterEntry[];
}) {
  return (
    <section className={styles.moduleStage} aria-labelledby="arp-appointments">
      <h2 id="arp-appointments" className={registerStyles.heading}>Active appointments</h2>
      {appointments.length === 0 ? (
        <p className={registerStyles.empty}>There are no active appointments to display.</p>
      ) : (
        <ul className={registerStyles.entries}>
          {appointments.map(({ id, participant, appointmentClass, instrument, expiresAt }) => (
            <li key={id} className={registerStyles.entry}>
              <h3>{participant.displayName}</h3>
              <p className={registerStyles.capacity}>{appointmentLabels[appointmentClass]}</p>
              <dl className={registerStyles.details}>
                <div>
                  <dt>Representative docket</dt>
                  <dd><code>{participant.docketReference}</code></dd>
                </div>
                <div>
                  <dt>Appointment reference</dt>
                  <dd><code>{instrument.reference}</code></dd>
                </div>
                <div>
                  <dt>Expiry</dt>
                  <dd>
                    {expiresAt ? (
                      <time dateTime={expiresAt}>{dateFormat.format(new Date(expiresAt))}</time>
                    ) : "No recorded expiry"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
