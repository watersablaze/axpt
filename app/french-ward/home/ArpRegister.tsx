"use client";

import { useRef, useState } from "react";
import type { RepresentativeAppointmentClass } from "@prisma/client";

import styles from "./home.module.css";
import registerStyles from "./ArpRegister.module.css";

export type ArpRegisterEntry = {
  id: string;
  appointmentClass: RepresentativeAppointmentClass;
  effectiveAt: string | null;
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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const filter = query.trim().toLowerCase();
  const matches = appointments.filter(({ participant }) =>
    participant.displayName.toLowerCase().includes(filter) ||
    participant.docketReference.toLowerCase().includes(filter),
  );
  const selected = matches.find(({ id }) => id === selectedId) ?? matches[0];

  return (
    <section className={`${styles.moduleStage} ${registerStyles.register}`} aria-labelledby="arp-appointments">
      <h2 id="arp-appointments" className={registerStyles.heading}>
        Active appointments <span>· {appointments.length}</span>
      </h2>
      {appointments.length === 0 ? (
        <p className={registerStyles.empty}>There are no active appointments to display.</p>
      ) : (
        <div className={registerStyles.layout} data-detail-open={detailOpen && Boolean(selected)}>
          <div className={registerStyles.directory}>
            <label htmlFor="arp-search">Find a representative</label>
            <input
              id="arp-search"
              ref={searchRef}
              type="search"
              placeholder="Name or docket"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {matches.length === 0 ? (
              <p role="status">No appointments match your search.</p>
            ) : (
              <ul className={registerStyles.entries}>
                {matches.map(({ id, participant }) => (
                  <li key={id}>
                    <button
                      type="button"
                      aria-current={selected?.id === id ? "true" : undefined}
                      onClick={() => {
                        setSelectedId(id);
                        setDetailOpen(true);
                        requestAnimationFrame(() => {
                          if (backRef.current?.getClientRects().length) backRef.current.focus();
                        });
                      }}
                    >
                      <span>{participant.displayName}</span>
                      <code>{participant.docketReference}</code>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={registerStyles.record}>
            {selected ? (
              <>
                <button
                  type="button"
                  ref={backRef}
                  className={registerStyles.back}
                  onClick={() => {
                    setDetailOpen(false);
                    requestAnimationFrame(() => searchRef.current?.focus());
                  }}
                >
                  Back to register
                </button>
                <article aria-labelledby="arp-selected-name">
                  <h3 id="arp-selected-name">{selected.participant.displayName}</h3>
                  <p className={registerStyles.capacity}>{appointmentLabels[selected.appointmentClass]}</p>
                  <dl className={registerStyles.details}>
                    <div>
                      <dt>Representative docket</dt>
                      <dd><code>{selected.participant.docketReference}</code></dd>
                    </div>
                    <div>
                      <dt>Appointment reference</dt>
                      <dd><code>{selected.instrument.reference}</code></dd>
                    </div>
                    <div>
                      <dt>Effective date</dt>
                      <dd><AppointmentDate value={selected.effectiveAt} fallback="No recorded effective date" /></dd>
                    </div>
                    <div>
                      <dt>Expiry</dt>
                      <dd><AppointmentDate value={selected.expiresAt} fallback="No recorded expiry" /></dd>
                    </div>
                  </dl>
                </article>
              </>
            ) : (
              <p>Select a matching appointment to view its details.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AppointmentDate({ value, fallback }: { value: string | null; fallback: string }) {
  return value ? <time dateTime={value}>{dateFormat.format(new Date(value))}</time> : fallback;
}
