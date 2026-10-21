"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./representative-admin-workspace.module.css";
export type DirectoryRecord = {
  id: string; reference: string; candidateDisplayName: string; candidateEmail: string; status: string;
  admittedParticipant: {id: string; docketReference: string; displayName: string; standing: string;
    userId: string | null; user: {email: string | null} | null} | null;
};
export default function RepresentativeRecordDirectory({selectedIntakeId, onSelect, refreshKey = 0}: {
  selectedIntakeId: string | null; onSelect: (intakeId: string, record?: DirectoryRecord) => void; refreshKey?: number;
}) {
  const [records, setRecords] = useState<DirectoryRecord[]>([]);
  const [search, setSearch] = useState(""), [activeQuery, setActiveQuery] = useState("");
  const [internalId, setInternalId] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true), [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null), generation = useRef(0);
  const load = useCallback(async (q: string, after: string | null = null) => {
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    const current = ++generation.current;
    setBusy(true); setError("");
    if (!after) {setRecords([]); setNextCursor(null); setActiveQuery(q);}
    try {
      const params = new URLSearchParams(); if (q) params.set("q", q); if (after) params.set("after", after);
      const response = await fetch("/api/admin/representative-program/record-directory?" + params,
        {cache: "no-store", signal: abort.signal});
      const payload = await response.json();
      if (!response.ok || payload.ok !== true || !Array.isArray(payload.records)) throw new Error("Directory unavailable");
      if (current !== generation.current) return;
      const incoming: DirectoryRecord[] = payload.records;
      setRecords(previous => after ? [...previous, ...incoming.filter(record => !previous.some(existing => existing.id === record.id))] : incoming);
      setNextCursor(typeof payload.nextCursor === "string" ? payload.nextCursor : null);
    } catch {
      if (!abort.signal.aborted && current === generation.current) setError("Records could not be loaded. Refresh to retry.");
    } finally {if (current === generation.current) setBusy(false);}
  }, []);
  useEffect(() => {
    setSearch(""); void load("");
    return () => {++generation.current; controller.current?.abort();};
  }, [load, refreshKey]);
  function submit(event: FormEvent<HTMLFormElement>) {event.preventDefault(); void load(search.trim());}
  return <div className={styles.directory} aria-busy={busy}>
    <div className={styles.directoryControls}>
      <form onSubmit={submit} className={styles.searchForm}>
        <label htmlFor="arp-record-search">Find a record</label>
        <input id="arp-record-search" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} placeholder="Name, email or reference" />
        <div className={styles.searchActions}><button type="submit" disabled={busy}>Search</button>
          <button type="button" disabled={busy} onClick={() => {setSearch(""); void load("");}}>All Records</button>
          <button type="button" disabled={busy} onClick={() => void load(activeQuery)} aria-label="Refresh record directory">↻</button></div>
      </form>
      <details className={styles.exactLookup}><summary>Open by internal ID</summary><form onSubmit={event => {
        event.preventDefault(); const id = internalId.trim(); if (id) onSelect(id);
      }}><label htmlFor="arp-exact-id">Internal intake ID</label><input id="arp-exact-id" value={internalId} required maxLength={191}
          onChange={event => setInternalId(event.target.value)} placeholder="Intake ID" /><button type="submit">Open Record</button></form></details>
    </div>
    <div className={styles.directoryList} tabIndex={0} aria-label="Existing intake records">
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <ul>{records.map(record => <li key={record.id}>
        <button type="button" className={styles.recordRow} aria-pressed={selectedIntakeId === record.id} onClick={() => onSelect(record.id, record)}>
          <span className={styles.rowName}>{record.candidateDisplayName}</span>
          <span className={styles.rowEmail}>{record.candidateEmail}</span>
          <span className={styles.rowReference}>{record.reference}</span>
          <span className={styles.rowStatus}>{record.status.replaceAll("_", " ")}</span>
          {record.admittedParticipant ? <span className={styles.rowParticipant}>{record.admittedParticipant.docketReference} · {record.admittedParticipant.standing.replaceAll("_", " ")}</span> : null}
        </button>
      </li>)}</ul>
      {!busy && !error && records.length === 0 ? <p role="status" className={styles.directoryEmpty}>{activeQuery ? "No records match this search." : "No intake records were returned from this environment."}</p> : null}
      {nextCursor ? <button type="button" className={styles.loadMore} disabled={busy} onClick={() => void load(activeQuery, nextCursor)}>Load More Records</button> : null}
    </div>
    <p role="status" className={styles.directoryCount}>{busy ? "Loading records…" : `${records.length} ${records.length === 1 ? "record" : "records"} shown${nextCursor ? " · More available" : ""}`}</p>
  </div>;
}
