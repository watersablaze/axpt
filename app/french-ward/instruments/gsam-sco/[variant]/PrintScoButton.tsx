"use client";

/** Uses the authenticated, actual SCO webpage and its own @media print CSS. */
export default function PrintScoButton() {
  return <button type="button" onClick={() => window.print()} style={{background:"#24324b",color:"white",border:0,borderRadius:4,padding:"9px 14px",cursor:"pointer",font:"inherit"}}>Save as PDF / Print</button>;
}
