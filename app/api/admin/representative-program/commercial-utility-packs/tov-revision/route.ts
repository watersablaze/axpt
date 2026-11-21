import {NextResponse} from "next/server";
import {z} from "zod";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {isSameOriginMutation} from "@/domains/auth/isSameOriginMutation";
import {prisma} from "@/infrastructure/db/prisma";
import {reviseTovRepresentativeCopy} from "@/domains/instruments/representative-program/commercial-utility-pack/commercial-papers/reviseTovRepresentativeCopy";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const schema=z.object({resourceReleaseId:z.string().min(1).max(191),reviewHash:z.string().regex(/^[a-f0-9]{64}$/),expectedPublicationHash:z.string().regex(/^[a-f0-9]{64}$/),reason:z.string().trim().min(8).max(1000)}).strict();
export async function POST(request:Request){
 const principal=await getPrincipal();if(!principal||!isAdmin(principal))return NextResponse.json({ok:false,error:"ADMIN_REQUIRED"},{status:403,headers});
 if(process.env.NODE_ENV!=="production" || !["www.axpt.io","axpt.io"].includes(new URL(request.url).hostname))return NextResponse.json({ok:false,error:"TOV_REVISION_LIVE_RUNTIME_REQUIRED"},{status:403,headers});
 if(!isSameOriginMutation(request))return NextResponse.json({ok:false,error:"ORIGIN_MISMATCH"},{status:403,headers});
 let fields;try{const raw=await request.text();if(Buffer.byteLength(raw)>4000)return NextResponse.json({ok:false},{status:413,headers});fields=schema.safeParse(JSON.parse(raw));}catch{return NextResponse.json({ok:false},{status:400,headers});}
 if(!fields.success)return NextResponse.json({ok:false,error:"INVALID_REVIEW"},{status:400,headers});
 try{return NextResponse.json({ok:true,...await reviseTovRepresentativeCopy({client:prisma,actorUserId:principal.userId,...fields.data})},{headers});}
 catch(error){const code=error instanceof Error?error.message.match(/^\[(TOV_REVISION_[A-Z_]+)\]$/)?.[1]:null;return NextResponse.json({ok:false,error:code??"REVISION_UNCONFIRMED"},{status:code==="TOV_REVISION_ADMIN_REQUIRED"?403:code?409:503,headers});}
}
