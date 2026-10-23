import {NextResponse} from "next/server";
import {getPrincipal} from "@/domains/auth/getPrincipal";
import {isAdmin} from "@/domains/auth/isAdmin";
import {projectFrenchWardInstitutionalProfile} from "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import {renderFrenchWardProfileHtml} from "@/components/french-ward/profile/renderFrenchWardProfileHtml";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET() {
 const headers={"Cache-Control":"private, no-store, max-age=0","Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
 const principal=await getPrincipal();
 if(!principal)return new NextResponse(null,{status:401,headers});
 if(!isAdmin(principal))return new NextResponse(null,{status:403,headers});
 try{return new NextResponse(await renderFrenchWardProfileHtml(projectFrenchWardInstitutionalProfile()),{headers});}
 catch{console.error("[ADMIN_PROFILE_HTML_PREVIEW_FAILED]");return new NextResponse(null,{status:503,headers});}
}
