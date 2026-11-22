import {TOV_PUBLICATION} from "@/domains/institutions/french-ward/tovPublication";
/** Callers supply only publication bytes resolved after their existing access/pin checks. */
export function TovPublicationView({html=TOV_PUBLICATION.html,publicationRevision=TOV_PUBLICATION.publicationRevision}:{html?:string;publicationRevision?:number}) {
  return <iframe title={`${TOV_PUBLICATION.reference} · Edition ${String(TOV_PUBLICATION.version).padStart(2,"0")} · Publication revision ${String(publicationRevision).padStart(2,"0")}`}
    sandbox="" srcDoc={html} style={{display:"block",width:"100%",height:"100dvh",minHeight:480,border:0,background:"#0b1720"}} />;
}
