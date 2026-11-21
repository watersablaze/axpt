"use client";
import { useState } from "react";
export function DeliveryControl(){
 const [busy,setBusy]=useState(false);const [result,setResult]=useState("");
 async function send(){
  if(!window.confirm("Send the GSAM institutional invitation to James Crawford at james.crawfordgcsam@protonmail.com? This is a real external email."))return;
  setBusy(true);setResult("");
  try {const response=await fetch("/api/admin/instruments/gsam-sco/delivery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({confirm:"SEND GSAM INVITATION"})}); const json=await response.json();if(!response.ok||!json.ok)throw new Error(json.error||"Dispatch failed");setResult(`Dispatch ${json.result.status}; provider message ID: ${json.result.messageId??"none"}. ${json.result.alreadyAttempted?"Existing attempt, not resent.":""}`);}catch(e){setResult(e instanceof Error?e.message:"Dispatch error");}finally{setBusy(false);}
 }
 return <div><button type="button" disabled={busy} onClick={send} style={{padding:"12px 20px",background:"#b99657",color:"#171713",fontWeight:700}}>{busy?"Sending…":"Send Invitation to James"}</button><p role="status">{result}</p></div>;
}
