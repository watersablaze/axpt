import Link from "next/link";
export function SupportingDocumentView({title,reference,version,note,documentHref,backHref,preview=false}: {
 title:string;reference:string;version:number;note:string;documentHref:string;backHref:string;preview?:boolean;
}) {
 return <main className="min-h-screen bg-[#0c1d25] p-4 text-[#eee7da] md:p-6">
  <div className="mx-auto max-w-7xl"><Link href={backHref} className="text-sm underline">← Back to documents</Link>
   {preview?<p className="mt-2 text-xs">Read-only operator preview</p>:null}
   <h1 className="mt-5 text-2xl">{title}</h1><p className="mt-2 text-xs">{reference} · Edition {version}</p>
   <p className="my-3 max-w-3xl text-sm leading-6">{note}</p>
   <a href={documentHref} target="_blank" rel="noopener noreferrer" className="inline-block py-2 text-sm underline">Open PDF in a new tab ↗</a>
   <iframe src={documentHref} title={title} className="mt-2 h-[78vh] min-h-[480px] w-full border border-[#567ba0] bg-white" />
  </div>
 </main>;
}
