import { NextResponse } from "next/server";
import { readSupportingDocument, type SupportingDocumentAccess } from "./readSupportingDocument";
import { readPrivateSupportingBlob } from "./readPrivateSupportingBlob";
export async function respondSupportingDocument(request:Request,authorize:()=>Promise<SupportingDocumentAccess|null>,readOnly=false) {
 const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Cross-Origin-Resource-Policy":"same-origin","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow"};
 const mode=new URL(request.url).searchParams.get("mode")??"inline";
 if (!["inline","download"].includes(mode)) return new NextResponse(null,{status:400,headers});
 if (readOnly&&mode==="download") return new NextResponse(null,{status:403,headers});
 try {
  const result=await readSupportingDocument({action:mode==="download"?"DOWNLOAD":"VIEW",authorize,read:readPrivateSupportingBlob});
  if(!result)return new NextResponse(null,{status:404,headers});
  const fileName=`${result.reference}-v${result.version}.pdf`.replace(/[^a-zA-Z0-9._-]/g,"_");
  return new NextResponse(Buffer.from(result.bytes),{headers:{...headers,"Content-Type":"application/pdf","Content-Disposition":`${mode==="download"?"attachment":"inline"}; filename="${fileName}"`,"Content-Length":String(result.bytes.byteLength)}});
 }catch{console.error("[ARP_SUPPORTING_DOCUMENT_READ_FAILED]");return new NextResponse(null,{status:503,headers});}
}
