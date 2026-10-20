"use client";
import { useEffect, useRef, useState } from "react";
import { runCupTiming, type TimingMaterial, type TimingRow, type TimingSample } from "./runCupTiming";
import styles from "./cup-timing.module.css";

function duration(sample?: TimingSample) { return sample ? (sample.totalMs / 1000).toFixed(2) + "s" : "—"; }
export default function CupTimingCheck({ materials }: { materials: TimingMaterial[] }) {
  const controller = useRef<AbortController | null>(null);
  const [rows, setRows] = useState<TimingRow[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("Ready");
  useEffect(() => () => controller.current?.abort(), []);
  async function run() {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setRows([]); setRunning(true); setMessage("Checking documents…");
    try {
      await runCupTiming({ origin: window.location.origin, materials, signal: current.signal,
        onRow: row => { if (current.signal.aborted) return;
          setRows(previous => [...previous.filter(item => item.id !== row.id), row]);
          setMessage(`Checked ${row.label} · request ${row.samples.length} of 2`);
        } });
      if (!current.signal.aborted) setMessage("Complete. HTTP/content checks only; visual behavior is not measured.");
    } catch {
      if (!current.signal.aborted) setMessage("Check could not run. Use the local workspace on localhost or 127.0.0.1.");
    } finally {
      if (controller.current === current) { controller.current = null; setRunning(false); }
    }
  }
  async function copy() {
    const report = ["Material\tFirst seconds\tRepeat seconds\tFirst result\tRepeat result\tServer-Timing",
      ...rows.map(row => [row.label, duration(row.samples[0]), duration(row.samples[1]),
        row.samples[0]?.result ?? "—", row.samples[1]?.result ?? "—",
        row.samples.map(sample => sample.serverTiming ?? "not exposed").join(" / ")].join("\t"))].join("\n");
    try { await navigator.clipboard.writeText(report); setMessage("Timing report copied."); }
    catch { setMessage("Clipboard unavailable. Select and copy the table below."); }
  }
  if (process.env.NODE_ENV !== "development") return null;
  return <details className={styles.panel}>
    <summary>Local document timing check</summary>
    <p>Tests all {materials.length} materials with your current session. Each is requested twice in succession. The first request may already be cached; no cache is cleared.</p>
    <div className={styles.controls}>
      <button type="button" disabled={running} onClick={() => void run()}>Check all documents</button>
      {running ? <button type="button" onClick={() => { controller.current?.abort(); setMessage("Stopped. Partial results retained."); }}>Stop</button> : null}
      <button type="button" disabled={running || !rows.length} onClick={() => void copy()}>Copy report</button>
    </div>
    <p role="status" aria-live="polite">{message}</p>
    {rows.length ? <div className={styles.scroll}><table>
      <caption>Browser request duration, including response bytes</caption>
      <thead><tr><th>Material</th><th>First</th><th>Repeat</th><th>Result · first / repeat</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.label}</th>
        <td>{duration(row.samples[0])}</td><td>{duration(row.samples[1])}</td>
        <td>{row.samples.map(sample => sample.result).join(" / ")}</td></tr>)}</tbody>
    </table></div> : null}
    <p>GET requests only. No invitations or emails. Server processing and cache hits are not inferred from elapsed time; they require server timing data.</p>
  </details>;
}
