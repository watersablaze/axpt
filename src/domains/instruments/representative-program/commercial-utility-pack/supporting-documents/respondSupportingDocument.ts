import { NextResponse } from "next/server";
import { readSupportingDocument, type SupportingDocumentAccess } from "./readSupportingDocument";
import { readPrivateSupportingBlob } from "./readPrivateSupportingBlob";
export async function respondSupportingDocument(request:Request,authorize:()=>Promise<SupportingDocumentAccess|null>,readOnly=false) {
 const headers:Record<string,string>={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow"};
 const mode=new URL(request.url).searchParams.get("mode")??"inline";
 if (!["inline","download"].includes(mode)) return new NextResponse(null,{status:400,headers});
 if (readOnly&&mode==="download") return new NextResponse(null,{status:403,headers});
 try {
  const started=performance.now();
  const authorizationMs:number[]=[];let storageMs=0;
  const measuredAuthorize=async()=>{const start=performance.now();try{return await authorize();}finally{authorizationMs.push(Math.round(performance.now()-start));}};
  const measuredRead=async(url:string,maximumBytes:number)=>{const start=performance.now();try{return await readPrivateSupportingBlob(url,maximumBytes);}finally{storageMs+=performance.now()-start;}};
  const result=await (async()=>{try{return await readSupportingDocument({action:mode==="download"?"DOWNLOAD":"VIEW",authorize:measuredAuthorize,read:measuredRead});}
    finally{if(process.env.NODE_ENV === "development") console.info("[ARP_SUPPORTING_READ_TIMING]",{
      authorizationMs,storageMs:Math.round(storageMs),totalMs:Math.round(performance.now()-started),
    });}})();
  if(process.env.NODE_ENV === "development") headers["Server-Timing"] =
    authorizationMs.map((ms,index)=>`authorization${index+1};dur=${ms}`).join(", ") +
    `, storage;dur=${storageMs.toFixed(1)}, read_total;dur=${(performance.now()-started).toFixed(1)}`;
  if(!result)return new NextResponse(null,{status:404,headers});
  const fileName=`${result.reference}-v${result.version}.pdf`.replace(/[^a-zA-Z0-9._-]/g,"_");
  return new NextResponse(Buffer.from(result.bytes),{headers:{...headers,"Content-Type":"application/pdf","Content-Disposition":`${mode==="download"?"attachment":"inline"}; filename="${fileName}"`,"Content-Length":String(result.bytes.byteLength)}});
 }catch{console.error("[ARP_SUPPORTING_DOCUMENT_READ_FAILED]");return new NextResponse(null,{status:503,headers});}
}
