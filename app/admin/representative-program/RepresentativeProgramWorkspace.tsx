"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import AdminSurfaceHeader from "@/components/admin/layout/AdminSurfaceHeader";
import RepresentativeInvitationForm from "./RepresentativeInvitationForm";
import RepresentativeIntakeInspector, {type RepresentativeIntakeIdentity} from "./RepresentativeIntakeInspector";
import RepresentativeRecordDirectory, {type DirectoryRecord} from "./RepresentativeRecordDirectory";
import OpenRepresentativeFieldRoom from "./OpenRepresentativeFieldRoom";
import styles from "./representative-admin-workspace.module.css";

export default function RepresentativeProgramWorkspace() {
  const [focusedIntakeId, setFocusedIntakeId] = useState<string | null>(null);
  const focusedId = useRef<string | null>(null);
  const [identity, setIdentity] = useState<RepresentativeIntakeIdentity | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DirectoryRecord | null>(null);
  const [mode, setMode] = useState<"record" | "invitation">("record");
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [directoryRevision, setDirectoryRevision] = useState(0);
  const selectRecord = useCallback((id: string, record?: DirectoryRecord) => {
    focusedId.current = id;
    setIdentity(previous => previous?.id === id ? previous : null);
    setFocusedIntakeId(id);
    setSelectedRecord(record ?? null); setMode("record"); setRecordsOpen(false); setContextOpen(false);
  }, []);
  const receiveIdentity = useCallback((record: RepresentativeIntakeIdentity | null, sourceId: string) => {
    if (sourceId === focusedId.current) setIdentity(record);
  }, []);
  function invitationIssued(id: string) {
    focusedId.current = id;
    setFocusedIntakeId(id); setSelectedRecord(null); setIdentity(null);
    setDirectoryRevision(value => value + 1);
    // Keep the invitation mounted and visible so its one-time credential receipt survives issuance.
  }
  const participantId = identity?.admittedParticipantId;
  const linkedRecord = selectedRecord?.id === focusedIntakeId ? selectedRecord : null;
  return <section className={styles.workspace} aria-label="Authorized Representation Program operator workspace">
    <AdminSurfaceHeader title="Authorized Representation Program"
      description="Candidate review, admission, appointment and representative field resources."
      actions={<><Link href="/admin">Admin</Link><Link href="/admin/incoming">Incoming</Link><Link href="/admin/control-center">Control Center</Link></>} />
    <div className={styles.commandBar}>
      <div className={styles.modeControls}>
        <button type="button" className={styles.mobileOnly} aria-expanded={recordsOpen} aria-controls="arp-record-rail"
          onClick={() => {setRecordsOpen(value => !value); setContextOpen(false);}}>Records</button>
        <button type="button" aria-pressed={mode === "record"} onClick={() => setMode("record")}>Record Workspace</button>
        <button type="button" className={styles.contextToggle} aria-expanded={contextOpen} aria-controls="arp-context-rail"
          onClick={() => {setContextOpen(value => !value); setRecordsOpen(false);}}>Context</button>
        <button type="button" aria-pressed={mode === "invitation"} onClick={() => {setMode("invitation"); setRecordsOpen(false); setContextOpen(false);}}>New Invitation</button>
      </div>
      <p className={styles.commandIdentity}>{identity?.candidateDisplayName || "No record selected"}
        {identity ? <span> · {identity.status.replaceAll("_", " ")}</span> : null}</p>
    </div>
    <div className={styles.desk}>
      {recordsOpen || contextOpen ? <button type="button" aria-label="Close side panel" className={styles.scrim} data-panel={recordsOpen ? "records" : "context"} onClick={() => {setRecordsOpen(false); setContextOpen(false);}} /> : null}
      <aside id="arp-record-rail" className={styles.recordRail} data-mobile-open={recordsOpen}
        onKeyDown={event => {if (event.key === "Escape") setRecordsOpen(false);}}>
        <div className={styles.railHeading}><h2>Records</h2><button type="button" className={styles.mobileOnly} onClick={() => setRecordsOpen(false)}>Close</button></div>
        <RepresentativeRecordDirectory selectedIntakeId={focusedIntakeId} onSelect={selectRecord} refreshKey={directoryRevision} />
      </aside>
      <section className={styles.stage} aria-label={mode === "invitation" ? "New representative invitation" : "Selected representative record"}>
        <div hidden={mode !== "invitation"} className={styles.invitationStage}>
          <div className={styles.stageHeading}><h2>New Representative Invitation</h2><p>Create a candidate intake and retain its private access receipt here.</p></div>
          <div className={styles.invitationBody}><RepresentativeInvitationForm onIssued={invitationIssued} /></div>
        </div>
        <div hidden={mode !== "record"} className={styles.recordStage}>
          {focusedIntakeId ? <RepresentativeIntakeInspector key={focusedIntakeId} focusedIntakeId={focusedIntakeId} onIdentity={receiveIdentity} />
            : <div className={styles.emptyStage}><p className={styles.eyebrow}>Representative Program</p><h2>Select an existing record</h2>
              <p>Choose a candidate from Records to review their intake, Agreement, appointment, CUP and access.</p>
              <button type="button" className={styles.mobileOnly} onClick={() => setRecordsOpen(true)}>Browse Records</button>
              <p className={styles.quiet}>New invitations are available from the command bar.</p></div>}
        </div>
      </section>
      <aside id="arp-context-rail" className={styles.contextRail} data-mobile-open={contextOpen} aria-label="Selected record context"
        onKeyDown={event => {if (event.key === "Escape") setContextOpen(false);}}>
        <div className={styles.railHeading}><h2>Record Context</h2><button type="button" className={styles.contextToggle} onClick={() => setContextOpen(false)}>Close</button></div>
        <div className={styles.contextBody}>
          {identity ? <>
            <p className={styles.eyebrow}>Selected Candidate</p><h2 className={styles.contextName}>{identity.candidateDisplayName}</h2>
            <dl className={styles.contextDetails}>
              <div><dt>Intake email</dt><dd>{identity.candidateEmail}</dd></div>
              <div><dt>Intake reference</dt><dd>{identity.reference}</dd></div>
              <div><dt>Intake status</dt><dd data-state={identity.status}>{identity.status.replaceAll("_", " ")}</dd></div>
              <div><dt>Qualification</dt><dd data-state={identity.qualificationDecision}>{identity.qualificationDecision.replaceAll("_", " ")}</dd></div>
              <div><dt>Participant ID</dt><dd>{participantId || "No admitted participant linked"}</dd></div>
              <div><dt>Linked account</dt><dd>{linkedRecord?.admittedParticipant?.user?.email || "Consult Access or refresh the record directory"}</dd></div>
            </dl>
            {participantId ? <div className={styles.contextActions}>
              <Link href={`/admin/representative-program/participants/${encodeURIComponent(participantId)}/workspace-preview`}
                target="_blank" rel="noopener noreferrer">Workspace Preview ↗</Link>
              <Link href={`/admin/representative-program/buyer-dossiers/email-preview?participantId=${encodeURIComponent(participantId)}`}
                target="_blank" rel="noopener noreferrer" prefetch={false}>Preview Buyer Email ↗</Link>
              <OpenRepresentativeFieldRoom key={participantId} participantId={participantId} />
            </div> : null}
          </> : <p className={styles.contextCopy}>{focusedIntakeId ? "Record identity appears after the selected intake loads." : "Select a record to see its identity, linked account and workspace access."}</p>}
          <div className={styles.contextNote}><h3>Operator controls</h3><p>Tools follow the selected record’s lifecycle. Agreement, appointment, CUP and access decisions remain separately governed.</p></div>
          <Link className={styles.contextLink} href="/admin/representative-program/buyer-dossiers">Buyer Introductions →</Link>
          <Link className={styles.contextLink} href="/admin/representative-program/profile-introductions">Profile Introductions →</Link>
        </div>
      </aside>
    </div>
  </section>;
}
