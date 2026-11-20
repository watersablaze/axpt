import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { PERMISSIONS } from "@/domains/auth/permissions";
import { sendGsamInvitation } from "@/domains/institutional-access/gsamDelivery";
export const runtime="nodejs";
export async function POST(request:Request){
 const principal=await getPrincipal();
 if(!principal)return NextResponse.json({ok:false,error:"Authentication required"},{status:401});
 if(!principal.permissions.includes(PERMISSIONS.INSTITUTIONAL_ACCESS_MANAGE))return NextResponse.json({ok:false,error:"Not authorized"},{status:403});
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({ok:false,error:"Invalid origin"},{status:403});
 const input=await request.json().catch(()=>null);
 if(!input || input.confirm!=="SEND GSAM INVITATION")return NextResponse.json({ok:false,error:"Explicit confirmation required"},{status:400});
 try{return NextResponse.json({ok:true,result:await sendGsamInvitation((principal as {userId?: string; id?: string}).userId ?? (principal as {id?: string}).id ?? "operator")});}catch(error){
 const msg=error instanceof Error?error.message:"GSAM_DISPATCH_FAILED";
 return NextResponse.json({ok:false,error:msg},{status:msg==="GSAM_RECIPIENT_GRANTS_NOT_READY"?409:500});
 }
}
