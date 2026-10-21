import { TOV_PUBLICATION } from "@/domains/institutions/french-ward/tovPublication";

/** Exact publication bytes pinned by CUP and buyer item metadata. No script or outward asset requests. */
export function TovPublicationView() {
  return <iframe title={`${TOV_PUBLICATION.reference} · Edition ${String(TOV_PUBLICATION.version).padStart(2, "0")}`}
    sandbox="" srcDoc={TOV_PUBLICATION.html}
    style={{display:"block",width:"100%",height:"100dvh",minHeight:480,border:0,background:"#0b1720"}} />;
}
