"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Event = { id:string; type:string; occurredAt:string; reason:string|null };
type Request = {id:string;requesterName:string;requesterEmail:string;institutionalAffiliation:string;requesterCapacity:string;purpose:string;scope:string;resourceReference:string;resourceVersion:number;status:string;createdAt:string;decisionReason:string|null;recipientUserId:string|null;grant:{id:string;expiresAt:string;revokedAt:string|null;recipientEmail:string}|null;events:Event[]};
type Grant = {id:string;requestId:string;recipientEmail:string;scope:string;resourceReference:string;resourceVersion:number;issuedAt:string;expiresAt:string;revokedAt:string|null};
const field: React.CSSProperties = {width:"100%", background:"#0c1421", color:"#edf1f7", border:"1px solid #33445b", padding:"10px 12px", borderRadius:4};
const button: React.CSSProperties = {background:"#1b3552",color:"#fff",padding:"10px 14px",border:"1px solid #536b85",cursor:"pointer",borderRadius:4};

export function InstitutionalAccessOperator({requests,grants}:{requests:Request[];grants:Grant[]}) {
  const router=useRouter();
  const [selected,setSelected]=useState(requests.find(r=>r.status==="PENDING")?.id ?? requests[0]?.id ?? "");
  const [reason,setReason]=useState("");
  const [expires,setExpires]=useState("");
  const [revokeReason,setRevokeReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState("");
  const current=requests.find(r=>r.id===selected);
  async function mutate(action:"APPROVED"|"DECLINED"|"REVOKE", id:string) {
    const activeReason=action==="REVOKE"?revokeReason:reason;
    if(!activeReason.trim()) {setFeedback("A decision reason is required.");return;}
    if(!window.confirm(`Confirm ${action.toLowerCase()}? This action writes an institutional access record.`))return;
    setBusy(true);setFeedback("");
    try {
      const res=await fetch(action==="REVOKE"?"/api/admin/institutional-access/revoke":"/api/admin/institutional-access/decision", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(action==="REVOKE"?{grantId:id,reason:activeReason}:{requestId:id,decision:action,reason:activeReason,...(action==="APPROVED"?{expiresAt:new Date(expires).toISOString()}: {})})});
      const result=await res.json();
      if(!res.ok||!result.ok)throw new Error(result.error||"Operator action failed.");
      setFeedback(
        action === "APPROVED"
          ? `Approval recorded. Recipient sign-in: ${result.result.recipientSignInUrl}. No notification email was sent.`
          : `${action} recorded. No notification email was sent.`
      );setReason("");setRevokeReason("");setExpires("");router.refresh();
    }catch(e){setFeedback(e instanceof Error?e.message:"Action failed.");}finally{setBusy(false);}
  }
  return <main style={{minHeight:"100vh",background:"#080e18",color:"#e9edf4",padding:"clamp(20px,4vw,50px)",fontFamily:"system-ui,sans-serif"}}>
    <div style={{maxWidth:1300,margin:"0 auto"}}>
      <p style={{letterSpacing:3,fontSize:11,color:"#a9bad2"}}>FRENCH-WARD / ADMINISTRATION</p>
      <h1 style={{fontSize:30,fontWeight:500,margin:"8px 0"}}>Institutional Profile Access</h1>
      <p style={{color:"#99a9bf"}}>Requests, decisions, and recipient-specific publication grants. No appointment or commercial authority is created here.</p>
      <div style={{display:"grid",gridTemplateColumns:"minmax(250px,1fr) minmax(0,2fr)",gap:18,marginTop:26}}>
        <section style={{border:"1px solid #26384d",padding:16}}><h2 style={{fontSize:15,marginBottom:16}}>Requests ({requests.length})</h2>
          <div style={{display:"grid",gap:8}}>{requests.map(r=><button key={r.id} onClick={()=>{setSelected(r.id);setFeedback("");setReason("");setExpires("");}} style={{textAlign:"left",padding:12,background:r.id===selected?"#192e45":"#0d1725",color:"#f1f4fa",border:"1px solid #30445b",cursor:"pointer"}}>
            <strong>{r.requesterName}</strong><div style={{fontSize:12,color:"#aabbd0"}}>{r.scope} · {r.status}</div><div style={{fontSize:11,color:"#8ea1b8"}}>{r.createdAt.slice(0,10)}</div>
          </button>)}</div>{requests.length===0&&<p>No institutional access requests.</p>}</section>
        <section style={{border:"1px solid #26384d",padding:22}}>{current?<>
          <p style={{fontSize:12,letterSpacing:2,color:"#92a8c6"}}>{current.status} / {current.scope}</p><h2 style={{fontSize:23,margin:"8px 0"}}>{current.requesterName}</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,fontSize:13,color:"#c4cfde",marginBottom:22}}>
            <div><strong>Email</strong><p>{current.requesterEmail}</p></div><div><strong>Affiliation</strong><p>{current.institutionalAffiliation}</p></div><div><strong>Capacity</strong><p>{current.requesterCapacity}</p></div><div><strong>Resource</strong><p>{current.resourceReference} · v{current.resourceVersion}</p></div>
          </div><h3 style={{fontSize:14}}>Stated purpose</h3><p style={{whiteSpace:"pre-wrap",color:"#bccadc"}}>{current.purpose}</p>
          {current.status==="PENDING"&&<div style={{borderTop:"1px solid #2c3f53",paddingTop:20,marginTop:20}}>
            <h3 style={{fontSize:15}}>Operator decision</h3>
            <p style={{fontSize:12,color:"#99aac0"}}>{current.recipientUserId?"Matching AXPT user identity found. Approval remains operator-controlled.":"Approval will provision a recipient account bound to this email. It creates no representative standing or delegated authority."}</p>
            <label style={{display:"block",margin:"14px 0"}}>Decision reason<textarea style={{...field,minHeight:85,marginTop:6}} value={reason} onChange={e=>setReason(e.target.value)} maxLength={3000}/></label>
            <label style={{display:"block",margin:"14px 0"}}>Approval expiration (local time)<input style={{...field,marginTop:6}} type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)}/></label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button style={button} disabled={busy||!expires||!reason.trim()} onClick={()=>mutate("APPROVED",current.id)}>Approve & issue grant</button><button style={button} disabled={busy||!reason.trim()} onClick={()=>mutate("DECLINED",current.id)}>Decline</button></div>
          </div>}
          {current.decisionReason&&<p>Decision reason: {current.decisionReason}</p>}
          <h3 style={{fontSize:14,marginTop:24}}>Event history</h3><ul>{current.events.map(e=><li key={e.id} style={{fontSize:12,marginBottom:8}}>{e.type} · {e.occurredAt.slice(0,19)} {e.reason&&`— ${e.reason}`}</li>)}</ul>
        </>:<p>Select a request.</p>}</section>
      </div>
      <section style={{border:"1px solid #26384d",padding:20,marginTop:20}}><h2 style={{fontSize:18}}>Issued grants</h2><label style={{display:"block",margin:"12px 0",maxWidth:680}}>Reason for revocation<textarea style={{...field,minHeight:68,marginTop:6}} maxLength={3000} value={revokeReason} onChange={e=>setRevokeReason(e.target.value)}/></label>
        <div style={{display:"grid",gap:8}}>{grants.map(g=><div key={g.id} style={{borderTop:"1px solid #25364a",padding:"12px 0",display:"flex",justifyContent:"space-between",alignItems:"center",gap:20,flexWrap:"wrap"}}><div><strong>{g.recipientEmail}</strong><div style={{fontSize:12,color:"#aabbd0"}}>{g.scope} · {g.resourceReference} v{g.resourceVersion} · Expires {g.expiresAt.slice(0,16)}</div><div style={{fontSize:12}}>{g.revokedAt?"REVOKED":new Date(g.expiresAt)<=new Date()?"EXPIRED":"ISSUED"}</div></div>{!g.revokedAt&&new Date(g.expiresAt)>new Date()&&<button style={button} disabled={busy||!revokeReason.trim()} onClick={()=>mutate("REVOKE",g.id)}>Revoke (reason required above)</button>}</div>)}</div>
      </section>
      {feedback&&<p role="status" style={{padding:14,border:"1px solid #5c708b",marginTop:15}}>{feedback}</p>}
    </div>
  </main>;
}
