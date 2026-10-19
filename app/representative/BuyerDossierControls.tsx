"use client";
import { useRef, useState, type FormEvent } from "react";
import canvas from "./cup-reading.module.css";
import type { BuyerDossierOption } from "@/domains/instruments/representative-program/commercial-utility-pack/application/loadBuyerDossierOptionsWithClient";
type Receipt = { id:string; recipientName:string; recipientEmail:string; expiresAt:string; revokedAt:string|null; recipientDeliveryStatus:string; adminDeliveryStatus:string };
const statusLabel = (value:string) => ({QUEUED:"Queued",SENDING:"Sending — refresh status",ACCEPTED:"Email provider accepted",FAILED:"Needs operator attention",DELIVERY_UNKNOWN:"Uncertain — operator review required",LOGGED_ONLY:"Test mode — no email sent"}[value] || "Unavailable");
export default function BuyerDossierControls({ options, readOnly=false, compact=false }: {options:BuyerDossierOption[];readOnly?:boolean;compact?:boolean}) {
  const [selected,setSelected]=useState<string[]>([]);
  const [includeLoiAccess,setIncludeLoiAccess]=useState(false);
  const [review,setReview]=useState<{reviewHash:string;loiAccess?:{label:string;reference:string;version:number};publications:Array<{label:string;reference:string;version:number}>}|null>(null);
  const [confirmed,setConfirmed]=useState(false);
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const [receipt,setReceipt]=useState<Receipt|null>(null);
  const [dossierId,setDossierId]=useState<string|null>(null);
  const inFlight=useRef(false);
  const submission=useRef<{signature:string;key:string}|null>(null);
  const endpoint="/api/representative/buyer-dossiers";
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(readOnly || inFlight.current || dossierId || !selected.length) return;
    if(review && !confirmed) return;
    const form=new FormData(event.currentTarget);
    const fields={includeLoiAccess,resourceReleaseIds:[...selected].sort(),recipientName:String(form.get("recipientName")||"").trim(),recipientEmail:String(form.get("recipientEmail")||"").trim().toLowerCase(),recipientOrganization:String(form.get("recipientOrganization")||"").trim(),purpose:String(form.get("purpose")||"").trim()};
    inFlight.current=true;setPending(true);setMessage("");
    try {
      if(!review) {
        const query=new URLSearchParams();query.set("includeLoiAccess",String(fields.includeLoiAccess));fields.resourceReleaseIds.forEach(id=>query.append("resourceReleaseId",id));
        const response=await fetch(endpoint+"?"+query,{cache:"no-store"});const result=await response.json();
        if(!response.ok || !result.ok) {setMessage("These materials cannot currently be shared under your appointment and permissions.");return;}
        setReview(result.review);setConfirmed(false);return;
      }
      const payload={...fields,reviewHash:review.reviewHash};
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(payload)));
      const signature=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,"0")).join("");
      const storageKey="arp-buyer-dossier:v1:"+signature;
      if(submission.current?.signature!==signature) {
        let key:string|null=null;try{key=sessionStorage.getItem(storageKey);}catch{}
        if(!key || !/^[0-9a-f-]{36}$/i.test(key))key=crypto.randomUUID();
        submission.current={signature,key};try{sessionStorage.setItem(storageKey,key);}catch{}
      }
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,idempotencyKey:submission.current!.key}),cache:"no-store"});
      const result=await response.json();
      if(!response.ok || !result.ok) {
        if([403,409].includes(response.status)){setReview(null);setConfirmed(false);}
        setMessage(response.status===429?"Invitation limit reached. Please try later.":response.status===403?"Sharing is currently unavailable.":response.status===409?"The review changed. Review the selection again.":"Outcome unconfirmed. Retry with the same details; do not create another invitation.");return;
      }
      setDossierId(result.dossierId);setReceipt(result.receipt||null);
      setMessage("Introduction recorded. Check recipient and Admin email status below.");
    } catch {setMessage("Response unconfirmed. Keep the same details and retry.");}
    finally{inFlight.current=false;setPending(false);}
  }
  async function refresh() {
    if(readOnly || inFlight.current || !dossierId)return;
    inFlight.current=true;setPending(true);
    try{const response=await fetch(endpoint+"?dossierId="+encodeURIComponent(dossierId),{cache:"no-store"});const result=await response.json();if(!response.ok||!result.ok)throw new Error();setReceipt(result.receipt);setMessage("Status refreshed; no email resent.");}
    catch{setMessage("Status unavailable. The recorded introduction remains in place.");}
    finally{inFlight.current=false;setPending(false);}
  }
  const locked=readOnly||pending;
  const inputClass="mt-1 w-full rounded border border-[#567ba0] bg-[#10242d] px-3 py-1.5 text-sm text-[#eee7da]";
  const buttonClass="rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] disabled:opacity-50";
  return <section id="buyer-invitation" aria-labelledby="buyer-invitation-heading" className={canvas.buyerAction}>
    {!compact ? <p className={canvas.actionEyebrow}>Buyer Introduction</p> : null}
    <h3 id="buyer-invitation-heading" className={compact ? "sr-only" : undefined}>Introduce a Buyer</h3>
    {!compact ? <p>Send one governed invitation with selected released materials. Access remains time-bound and French-Ward Administration is notified.</p> : null}
    {readOnly && !compact?<p className={canvas.actionPreviewNote}>Read-only representative preview</p>:null}
    {!dossierId?<details className={canvas.buyerActionDetails}><summary>{compact ? "Introduce Buyer" : "Prepare Invitation"} <span aria-hidden="true">→</span></summary>
      {readOnly ? <p className={canvas.actionPreviewNote}>Read-only preview · Sending is disabled.</p> : null}
      <p className={canvas.invitationIntro}>Select released materials and arrange recipient-specific access. French-Ward Administration is notified.</p>
      <form onSubmit={submit} className="mt-3 grid max-w-3xl gap-x-3 gap-y-2 sm:grid-cols-2" onChange={()=>{setReview(null);setConfirmed(false);}}>
        <fieldset disabled={locked} className="sm:col-span-2"><legend className="mb-2 text-sm">Select materials</legend>
          {options.map(option=><label key={option.id} className="mb-2 flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.includes(option.id)} disabled={locked||!option.canTransmit}
            onChange={event=>setSelected(current=>event.target.checked?[...current,option.id]:current.filter(id=>id!==option.id))}/><span>{option.label}{!option.canTransmit?<span className="ml-2 text-xs text-[#d8c39b]">Sharing not released</span>:null}</span></label>)}
          {!options.length?<p className="text-sm">No supported publications are currently released to this CUP.</p>:null}
        </fieldset>
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={includeLoiAccess} disabled={locked}
            onChange={event=>setIncludeLoiAccess(event.target.checked)}/>
          <span>Include LOI access<span className="mt-1 block text-xs leading-5 text-[#b7c5ce]">
            Permit this recipient to open and submit the Letter of Intent during this invitation’s access period.
            This does not approve a proposed transaction.
          </span></span>
        </label>
        <label className="text-sm">Recipient name<input name="recipientName" className={inputClass} required maxLength={120} disabled={locked}/></label>
        <label className="text-sm">Recipient email<input name="recipientEmail" type="email" className={inputClass} required maxLength={254} disabled={locked}/></label>
        <label className="text-sm">Organization<input name="recipientOrganization" className={inputClass} required maxLength={180} disabled={locked}/></label>
        <label className="text-sm">Purpose<textarea name="purpose" rows={1} className={inputClass} required maxLength={1000} disabled={locked}/></label>
        <p className="text-xs text-[#b7c5ce] sm:col-span-2">Purpose is visible to Admin only.</p>
        {review?<div className="text-sm sm:col-span-2" onChange={event=>event.stopPropagation()}>
          <p>Reviewed materials:</p><ul className="my-2 list-inside list-disc">{review.publications.map(item=><li key={item.reference}>{item.label} · Edition {item.version}</li>)}</ul>
          {review.loiAccess?<p className="my-3 text-[#ead3a4]">Included: {review.loiAccess.label} · Version {review.loiAccess.version} · Form access and submission.</p>:<p className="my-3 text-[#b7c5ce]">LOI access is not included.</p>}
          <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={locked} onChange={event=>setConfirmed(event.target.checked)}/>I confirm this recipient, selected materials, and the LOI access decision shown above.</label>
        </div>:null}
        <button className={buttonClass+" justify-self-start"} type="submit" disabled={locked||!selected.length||Boolean(review&&!confirmed)}>{pending?"Processing…":review?"Send Buyer Invitation":"Review Selection"}</button>
      </form>
    </details>:<div className="mt-3 text-sm leading-6">
      {receipt?<><p>{receipt.recipientName} · {receipt.recipientEmail}</p><p>Recipient: {statusLabel(receipt.recipientDeliveryStatus)}</p><p>Admin: {statusLabel(receipt.adminDeliveryStatus)}</p><p>Expires: {new Date(receipt.expiresAt).toLocaleString()}</p></>:<p>Introduction recorded; refresh to inspect delivery.</p>}
      <div className="mt-3 flex flex-wrap gap-3"><button className={buttonClass} type="button" disabled={locked} onClick={refresh}>Refresh Status</button>
      <button className={buttonClass} type="button" disabled={locked} onClick={()=>{setDossierId(null);setReceipt(null);setReview(null);setConfirmed(false);setSelected([]);setIncludeLoiAccess(false);setMessage("");if(submission.current){try{sessionStorage.removeItem("arp-buyer-dossier:v1:"+submission.current.signature);}catch{}}submission.current=null;}}>Introduce Another Buyer</button></div>
    </div>}
    <p role="status" aria-live="polite" className={message?"mt-3 text-sm text-[#d8c39b]":"sr-only"}>{message}</p>
  </section>;
}
