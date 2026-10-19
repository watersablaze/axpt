"use client";
import { useState } from "react";
import CupPdfReader from "./CupPdfReader";
import { SUPPORTING_DOCUMENTS } from "@/domains/instruments/representative-program/commercial-utility-pack/supporting-documents/catalog";
import styles from "./cup-reading.module.css";
export default function CupMaterialReader({ resourceReleaseId, resourceReference, title, previewParticipantId }: {
  resourceReleaseId: string; resourceReference?: string; title: string; previewParticipantId?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = "/representative/materials/" + encodeURIComponent(resourceReleaseId) + "/reader" +
    (previewParticipantId ? "?previewParticipantId=" + encodeURIComponent(previewParticipantId) : "");
  const publication = SUPPORTING_DOCUMENTS.find(entry => entry.reference === resourceReference);
  const api = previewParticipantId
    ? "/api/admin/representative-program/participants/" + encodeURIComponent(previewParticipantId) +
      "/workspace-preview/resources/" + encodeURIComponent(resourceReleaseId)
    : "/api/representative/commercial-utility-packs/resources/" + encodeURIComponent(resourceReleaseId);
  if (publication) return <section className={styles.reader} aria-label="Material reading surface">
    <p className={styles.readerStatus}>{publication.disclosureNote}</p>
    <CupPdfReader key={resourceReleaseId} title={title} href={api + "/supporting-document?mode=inline"} />
  </section>;
  return <section className={styles.reader} aria-label="Material reading surface">
    {!loaded ? <p role="status" className={styles.readerStatus}>Opening authorized material…</p> : null}
    <iframe src={src} title={title} onLoad={() => setLoaded(true)} className={styles.readerFrame} />
    <p className={styles.readerFallback}>If the material cannot be displayed here, use Open separately above.</p>
  </section>;
}
