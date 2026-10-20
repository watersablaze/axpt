"use client";
import { useEffect, useRef, useState } from "react";
import CupPdfReader from "./CupPdfReader";
import CupReaderStatus from "./CupReaderStatus";
import { SUPPORTING_DOCUMENTS } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog";
import styles from "./cup-reading.module.css";
export default function CupMaterialReader(props: {
  resourceReleaseId: string; resourceReference?: string; resourceType?: string; agreementPdf?: boolean; title: string; previewParticipantId?: string;
}) {
  // A changed resource always receives fresh loading state and a fresh authorized request.
  return <Material key={props.resourceReleaseId + ":" + (props.previewParticipantId || "")} {...props} />;
}
function Material({ resourceReleaseId, resourceReference, resourceType, agreementPdf, title, previewParticipantId }: {
  resourceReleaseId: string; resourceReference?: string; resourceType?: string; agreementPdf?: boolean; title: string; previewParticipantId?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const publication = SUPPORTING_DOCUMENTS.find(entry => entry.reference === resourceReference);
  const query = new URLSearchParams();
  if (previewParticipantId) query.set("previewParticipantId", previewParticipantId);
  if (resourceType === "STRUCTURED_CONTENT") query.set("renderer", "structured");
  if (resourceType === "INSTITUTIONAL_INSTRUMENT") query.set("renderer", "institutional");
  const src = "/representative/materials/" + encodeURIComponent(resourceReleaseId) + "/reader" +
    (query.size ? "?" + query.toString() : "");
  const api = previewParticipantId
    ? "/api/admin/representative-program/participants/" + encodeURIComponent(previewParticipantId) +
      "/workspace-preview/resources/" + encodeURIComponent(resourceReleaseId)
    : "/api/representative/commercial-utility-packs/resources/" + encodeURIComponent(resourceReleaseId);
  useEffect(() => {
    if (publication || agreementPdf) return;
    let settled = false;
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow ||
          event.data?.type !== "arp:material-state" || !["ready", "error"].includes(event.data.state)) return;
      settled = true;
      clearTimeout(timer);
      setState(event.data.state);
    }
    const timer = setTimeout(() => { if (!settled) setState("error"); }, 90000);
    window.addEventListener("message", receive);
    return () => { clearTimeout(timer); window.removeEventListener("message", receive); };
  }, [publication, agreementPdf, attempt]);
  if (agreementPdf) return <section className={styles.reader} aria-label="Material reading surface">
    <CupPdfReader title={title} href={api + "/document?mode=inline"} />
  </section>;
  if (publication) return <section className={styles.reader} aria-label="Material reading surface">
    <p className={styles.readerStatus}>{publication.disclosureNote}</p>
    <CupPdfReader title={title} href={api + "/supporting-document?mode=inline"} />
  </section>;
  return <section className={styles.reader} aria-label="Material reading surface">
    <div className={styles.readerViewport} aria-busy={state === "loading"}>
      {state !== "ready" ? <div className={styles.readerOverlay} style={{ pointerEvents: "auto" }}>
        <CupReaderStatus error={state === "error" ? "This material could not be opened. Try again or use Open separately." : undefined}
          retry={state === "error" ? () => { setState("loading"); setAttempt(value => value + 1); } : undefined} />
      </div> : null}
      <iframe key={attempt} ref={frame} src={src} title={title} className={styles.readerFrame}
        sandbox="allow-scripts allow-same-origin"
        style={{ visibility: state === "ready" ? "visible" : "hidden" }} />
    </div>
  </section>;
}
