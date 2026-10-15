"use client";
import Link from "next/link";
import { useRef, useState } from "react";
export default function ProfileUseControls({ resourceReleaseId, readOnly=false }: {resourceReleaseId:string;readOnly?:boolean}) {
  const [pending,setPending]=useState(false);
  const [message,setMessage]=useState("");
  const inFlight=useRef(false);
  async function present() {
    if(readOnly||inFlight.current)return;
    inFlight.current=true;setPending(true);setMessage("");
    try {
      const expected="/representative/resources/"+encodeURIComponent(resourceReleaseId);
      const response=await fetch("/api/representative/commercial-utility-packs/resources/"+encodeURIComponent(resourceReleaseId)+"/profile/use",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"PRESENT"}),cache:"no-store"});
      const result=await response.json();
      if(!response.ok||!result.ok||result.action!=="PRESENT"||result.url!==expected)throw new Error();
      window.location.assign(expected);
    } catch {setMessage("Presentation is unavailable under your current permissions.");}
    finally{inFlight.current=false;setPending(false);}
  }
  const buttonClass="rounded border border-[#567ba0] px-4 py-2 text-sm text-[#eee7da] disabled:opacity-50";
  return <section aria-label="Profile actions" className="my-3 flex flex-wrap items-center gap-3 rounded border border-[#30495c] px-4 py-3">
    <p className="mr-auto text-sm text-[#eee7da]">Official Profile</p>
    <button className={buttonClass} type="button" disabled={readOnly||pending} onClick={present}>Open for Presentation</button>
    {readOnly?<span className="text-xs text-[#d8c39b]">Read-only preview · Buyer invitations are prepared from CUP.</span>:<Link className={buttonClass} href="/representative#buyer-invitation">Introduce a Buyer</Link>}
    <p role="status" aria-live="polite" className={message?"w-full text-sm text-[#d8c39b]":"sr-only"}>{message}</p>
  </section>;
}
